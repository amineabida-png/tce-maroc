import { Prisma, type StatutCommande } from '@prisma/client';
import { prisma } from '../../db/client';
import { AppError } from '../../middleware/errorHandler';
import { computeTotaux } from '../../lib/money';
import { nextNumero } from '../../lib/numerotation';
import { isRoleManager } from '../../lib/roles';
import { type PaginationParams, toPaginatedResult } from '../../lib/pagination';
import { getSociete } from '../societe/service';
import type { CommandeContentInput } from './schema';

function normalizeEmptyToNull<T>(value: T | '' | null | undefined): T | null | undefined {
  if (value === undefined) return undefined;
  if (value === '') return null;
  return value as T;
}

const STATUTS_MODIFIABLES: StatutCommande[] = ['BROUILLON'];

const TRANSITIONS_AUTORISEES: Record<StatutCommande, StatutCommande[]> = {
  BROUILLON: ['CONFIRMEE', 'ANNULEE'],
  CONFIRMEE: ['ANNULEE'],
  ANNULEE: [],
  FACTUREE: [],
};

const COMMANDE_INCLUDE = {
  client: { select: { id: true, nom: true, ice: true, adresse: true, ville: true } },
  chantier: { select: { id: true, nom: true } },
  devis: { select: { id: true, numero: true } },
  lignes: { orderBy: { ordre: 'asc' } },
} satisfies Prisma.CommandeInclude;

function withTotaux<T extends { tauxTva: Prisma.Decimal; lignes: { quantite: Prisma.Decimal; prixUnitaire: Prisma.Decimal }[] }>(
  commande: T
) {
  return { ...commande, totaux: computeTotaux(commande.lignes, commande.tauxTva) };
}

export async function listCommandes(params: PaginationParams, filters: { statut?: string; clientId?: string; chantierId?: string }) {
  const where: Prisma.CommandeWhereInput = {
    ...(filters.statut ? { statut: filters.statut as StatutCommande } : {}),
    ...(filters.clientId ? { clientId: filters.clientId } : {}),
    ...(filters.chantierId ? { chantierId: filters.chantierId } : {}),
    ...(params.q
      ? { OR: [{ numero: { contains: params.q, mode: 'insensitive' } }, { client: { nom: { contains: params.q, mode: 'insensitive' } } }] }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.commande.findMany({
      where,
      orderBy: { date: 'desc' },
      skip: params.skip,
      take: params.pageSize,
      include: { client: { select: { id: true, nom: true } }, chantier: { select: { id: true, nom: true } } },
    }),
    prisma.commande.count({ where }),
  ]);

  const withSums = await Promise.all(
    items.map(async (c) => {
      const lignes = await prisma.ligneCommande.findMany({ where: { commandeId: c.id }, select: { quantite: true, prixUnitaire: true } });
      return { ...c, totaux: computeTotaux(lignes, c.tauxTva) };
    })
  );

  return toPaginatedResult(withSums, total, params);
}

async function fetchCommandeOrThrow(id: string) {
  const commande = await prisma.commande.findUnique({ where: { id }, include: COMMANDE_INCLUDE });
  if (!commande) throw new AppError(404, 'Commande introuvable.');
  return commande;
}

export async function getCommande(id: string) {
  return withTotaux(await fetchCommandeOrThrow(id));
}

export async function createCommande(data: CommandeContentInput) {
  const societe = await getSociete();
  const numerotation = societe.numerotations.find((n) => n.typeDocument === 'BON_COMMANDE');
  const numero = await nextNumero(societe.id, 'BON_COMMANDE', numerotation?.prefixe ?? 'BC');

  const commandeId = await prisma.$transaction(async (tx) => {
    const commande = await tx.commande.create({
      data: {
        numero,
        clientId: data.clientId,
        chantierId: normalizeEmptyToNull(data.chantierId) ?? null,
        tauxTva: data.tauxTva ?? societe.tauxTvaDefaut,
      },
    });
    for (let i = 0; i < data.lignes.length; i++) {
      const ligne = data.lignes[i]!;
      await tx.ligneCommande.create({ data: { commandeId: commande.id, ordre: i, ...ligne } });
    }
    return commande.id;
  });

  return getCommande(commandeId);
}

export async function updateCommande(id: string, data: CommandeContentInput, role?: string) {
  const existing = await prisma.commande.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, 'Commande introuvable.');
  if (!STATUTS_MODIFIABLES.includes(existing.statut) && !isRoleManager(role)) {
    throw new AppError(409, 'Cette commande ne peut plus être modifiée (déjà confirmée, facturée ou annulée).');
  }

  await prisma.$transaction(async (tx) => {
    await tx.ligneCommande.deleteMany({ where: { commandeId: id } });
    await tx.commande.update({
      where: { id },
      data: {
        clientId: data.clientId,
        chantierId: normalizeEmptyToNull(data.chantierId) ?? null,
        tauxTva: data.tauxTva,
      },
    });
    for (let i = 0; i < data.lignes.length; i++) {
      const ligne = data.lignes[i]!;
      await tx.ligneCommande.create({ data: { commandeId: id, ordre: i, ...ligne } });
    }
  });

  return getCommande(id);
}

export async function deleteCommande(id: string, role?: string): Promise<void> {
  const commande = await prisma.commande.findUnique({ where: { id } });
  if (!commande) throw new AppError(404, 'Commande introuvable.');
  if (commande.statut !== 'BROUILLON' && !isRoleManager(role)) {
    throw new AppError(409, 'Seule une commande en brouillon peut être supprimée.');
  }
  await prisma.commande.delete({ where: { id } });
}

export async function changeStatutCommande(id: string, nouveauStatut: StatutCommande) {
  const commande = await prisma.commande.findUnique({ where: { id } });
  if (!commande) throw new AppError(404, 'Commande introuvable.');
  const autorises = TRANSITIONS_AUTORISEES[commande.statut];
  if (!autorises.includes(nouveauStatut)) {
    throw new AppError(409, `Transition de statut invalide : ${commande.statut} → ${nouveauStatut}.`);
  }
  await prisma.commande.update({ where: { id }, data: { statut: nouveauStatut } });
  return getCommande(id);
}

export async function convertirEnFacture(id: string) {
  const commande = await fetchCommandeOrThrow(id);
  if (commande.statut !== 'CONFIRMEE') {
    throw new AppError(409, 'Seule une commande confirmée peut être convertie en facture.');
  }

  const societe = await getSociete();
  const numerotation = societe.numerotations.find((n) => n.typeDocument === 'FACTURE');
  const numero = await nextNumero(societe.id, 'FACTURE', numerotation?.prefixe ?? 'FACT');

  const factureId = await prisma.$transaction(async (tx) => {
    const facture = await tx.facture.create({
      data: {
        numero,
        commandeId: commande.id,
        devisId: commande.devisId,
        clientId: commande.clientId,
        chantierId: commande.chantierId,
        tauxTva: commande.tauxTva,
        tauxRetenueGarantie: societe.tauxRetenueGarantie,
        statut: 'BROUILLON',
      },
    });
    for (let i = 0; i < commande.lignes.length; i++) {
      const ligne = commande.lignes[i]!;
      await tx.ligneFacture.create({
        data: {
          factureId: facture.id,
          designation: ligne.designation,
          unite: ligne.unite,
          quantite: ligne.quantite,
          prixUnitaire: ligne.prixUnitaire,
          ordre: i,
        },
      });
    }
    await tx.commande.update({ where: { id: commande.id }, data: { statut: 'FACTUREE' } });
    return facture.id;
  });

  return factureId;
}
