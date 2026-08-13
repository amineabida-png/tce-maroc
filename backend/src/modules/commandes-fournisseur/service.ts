import { Prisma, type StatutCommandeFournisseur } from '@prisma/client';
import { prisma } from '../../db/client';
import { AppError } from '../../middleware/errorHandler';
import { computeTotaux } from '../../lib/money';
import { nextNumero } from '../../lib/numerotation';
import { type PaginationParams, toPaginatedResult } from '../../lib/pagination';
import { getSociete } from '../societe/service';
import type { CommandeFournisseurContentInput, ReceptionInput } from './schema';

function normalizeEmptyToNull<T>(value: T | '' | null | undefined): T | null | undefined {
  if (value === undefined) return undefined;
  if (value === '') return null;
  return value as T;
}

const STATUTS_MODIFIABLES: StatutCommandeFournisseur[] = ['BROUILLON'];
const STATUTS_RECEPTIONNABLES: StatutCommandeFournisseur[] = ['ENVOYEE', 'PARTIELLEMENT_RECUE'];

const TRANSITIONS_AUTORISEES: Record<StatutCommandeFournisseur, StatutCommandeFournisseur[]> = {
  BROUILLON: ['ENVOYEE', 'ANNULEE'],
  ENVOYEE: ['ANNULEE'],
  PARTIELLEMENT_RECUE: [],
  RECUE: [],
  ANNULEE: [],
};

const CF_INCLUDE = {
  fournisseur: { select: { id: true, nom: true, ice: true, adresse: true, ville: true } },
  chantier: { select: { id: true, nom: true } },
  lignes: { orderBy: { ordre: 'asc' }, include: { article: { select: { id: true, nom: true } } } },
} satisfies Prisma.CommandeFournisseurInclude;

function withTotaux<
  T extends { tauxTva: Prisma.Decimal; lignes: { quantiteCommandee: Prisma.Decimal; prixUnitaire: Prisma.Decimal }[] },
>(cf: T) {
  const lignesPourCalcul = cf.lignes.map((l) => ({ quantite: l.quantiteCommandee, prixUnitaire: l.prixUnitaire }));
  return { ...cf, totaux: computeTotaux(lignesPourCalcul, cf.tauxTva) };
}

export async function listCommandesFournisseur(
  params: PaginationParams,
  filters: { statut?: string; fournisseurId?: string; chantierId?: string }
) {
  const where: Prisma.CommandeFournisseurWhereInput = {
    ...(filters.statut ? { statut: filters.statut as StatutCommandeFournisseur } : {}),
    ...(filters.fournisseurId ? { fournisseurId: filters.fournisseurId } : {}),
    ...(filters.chantierId ? { chantierId: filters.chantierId } : {}),
    ...(params.q
      ? {
          OR: [
            { numero: { contains: params.q, mode: 'insensitive' } },
            { fournisseur: { nom: { contains: params.q, mode: 'insensitive' } } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.commandeFournisseur.findMany({
      where,
      orderBy: { date: 'desc' },
      skip: params.skip,
      take: params.pageSize,
      include: { fournisseur: { select: { id: true, nom: true } }, chantier: { select: { id: true, nom: true } } },
    }),
    prisma.commandeFournisseur.count({ where }),
  ]);

  const withSums = await Promise.all(
    items.map(async (cf) => {
      const lignes = await prisma.ligneCommandeFournisseur.findMany({
        where: { commandeFournisseurId: cf.id },
        select: { quantiteCommandee: true, prixUnitaire: true },
      });
      return {
        ...cf,
        totaux: computeTotaux(
          lignes.map((l) => ({ quantite: l.quantiteCommandee, prixUnitaire: l.prixUnitaire })),
          cf.tauxTva
        ),
      };
    })
  );

  return toPaginatedResult(withSums, total, params);
}

async function fetchCommandeFournisseurOrThrow(id: string) {
  const cf = await prisma.commandeFournisseur.findUnique({ where: { id }, include: CF_INCLUDE });
  if (!cf) throw new AppError(404, 'Commande fournisseur introuvable.');
  return cf;
}

export async function getCommandeFournisseur(id: string) {
  return withTotaux(await fetchCommandeFournisseurOrThrow(id));
}

export async function createCommandeFournisseur(data: CommandeFournisseurContentInput) {
  const societe = await getSociete();
  const numerotation = societe.numerotations.find((n) => n.typeDocument === 'BON_COMMANDE_FOURNISSEUR');
  const numero = await nextNumero(societe.id, 'BON_COMMANDE_FOURNISSEUR', numerotation?.prefixe ?? 'BCF');

  const id = await prisma.$transaction(async (tx) => {
    const cf = await tx.commandeFournisseur.create({
      data: {
        numero,
        fournisseurId: data.fournisseurId,
        chantierId: normalizeEmptyToNull(data.chantierId) ?? null,
        tauxTva: data.tauxTva ?? societe.tauxTvaDefaut,
      },
    });
    for (let i = 0; i < data.lignes.length; i++) {
      const ligne = data.lignes[i]!;
      await tx.ligneCommandeFournisseur.create({
        data: {
          commandeFournisseurId: cf.id,
          articleId: normalizeEmptyToNull(ligne.articleId) ?? null,
          designation: ligne.designation,
          unite: ligne.unite,
          quantiteCommandee: ligne.quantiteCommandee,
          prixUnitaire: ligne.prixUnitaire,
          ordre: i,
        },
      });
    }
    return cf.id;
  });

  return getCommandeFournisseur(id);
}

export async function updateCommandeFournisseur(id: string, data: CommandeFournisseurContentInput) {
  const existing = await prisma.commandeFournisseur.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, 'Commande fournisseur introuvable.');
  if (!STATUTS_MODIFIABLES.includes(existing.statut)) {
    throw new AppError(409, 'Cette commande ne peut plus être modifiée (déjà envoyée, reçue ou annulée).');
  }

  await prisma.$transaction(async (tx) => {
    await tx.ligneCommandeFournisseur.deleteMany({ where: { commandeFournisseurId: id } });
    await tx.commandeFournisseur.update({
      where: { id },
      data: {
        fournisseurId: data.fournisseurId,
        chantierId: normalizeEmptyToNull(data.chantierId) ?? null,
        tauxTva: data.tauxTva,
      },
    });
    for (let i = 0; i < data.lignes.length; i++) {
      const ligne = data.lignes[i]!;
      await tx.ligneCommandeFournisseur.create({
        data: {
          commandeFournisseurId: id,
          articleId: normalizeEmptyToNull(ligne.articleId) ?? null,
          designation: ligne.designation,
          unite: ligne.unite,
          quantiteCommandee: ligne.quantiteCommandee,
          prixUnitaire: ligne.prixUnitaire,
          ordre: i,
        },
      });
    }
  });

  return getCommandeFournisseur(id);
}

export async function deleteCommandeFournisseur(id: string): Promise<void> {
  const cf = await prisma.commandeFournisseur.findUnique({ where: { id } });
  if (!cf) throw new AppError(404, 'Commande fournisseur introuvable.');
  if (cf.statut !== 'BROUILLON') throw new AppError(409, 'Seule une commande en brouillon peut être supprimée.');
  await prisma.commandeFournisseur.delete({ where: { id } });
}

export async function changeStatutCommandeFournisseur(id: string, nouveauStatut: StatutCommandeFournisseur) {
  const cf = await prisma.commandeFournisseur.findUnique({ where: { id } });
  if (!cf) throw new AppError(404, 'Commande fournisseur introuvable.');
  const autorises = TRANSITIONS_AUTORISEES[cf.statut];
  if (!autorises.includes(nouveauStatut)) {
    throw new AppError(409, `Transition de statut invalide : ${cf.statut} → ${nouveauStatut}.`);
  }
  await prisma.commandeFournisseur.update({ where: { id }, data: { statut: nouveauStatut } });
  return getCommandeFournisseur(id);
}

// La réception (totale ou partielle) génère un MouvementStock ENTREE pour
// chaque ligne liée à un article du catalogue, et recalcule le statut de la
// commande à partir des quantités reçues réelles — jamais fixé
// manuellement, pour ne jamais afficher "reçue" sur une commande qui ne
// l'est pas totalement.
export async function receptionner(id: string, input: ReceptionInput) {
  const cf = await fetchCommandeFournisseurOrThrow(id);
  if (!STATUTS_RECEPTIONNABLES.includes(cf.statut)) {
    throw new AppError(409, 'Seule une commande envoyée ou partiellement reçue peut faire l’objet d’une réception.');
  }

  await prisma.$transaction(async (tx) => {
    for (const entry of input.lignes) {
      const ligne = cf.lignes.find((l) => l.id === entry.ligneId);
      if (!ligne) throw new AppError(400, `Ligne ${entry.ligneId} introuvable sur cette commande.`);
      if (entry.quantiteRecue <= 0) continue;

      const dejaRecue = Number(ligne.quantiteRecue);
      const commandee = Number(ligne.quantiteCommandee);
      const nouvelleQuantiteRecue = dejaRecue + entry.quantiteRecue;
      if (nouvelleQuantiteRecue > commandee + 1e-6) {
        throw new AppError(400, `La quantité reçue dépasse la quantité commandée pour « ${ligne.designation} ».`);
      }

      await tx.ligneCommandeFournisseur.update({
        where: { id: entry.ligneId },
        data: { quantiteRecue: nouvelleQuantiteRecue },
      });

      if (ligne.articleId) {
        await tx.mouvementStock.create({
          data: {
            articleId: ligne.articleId,
            type: 'ENTREE',
            quantite: entry.quantiteRecue,
            prixUnitaire: ligne.prixUnitaire,
            chantierId: cf.chantierId,
            commandeFournisseurId: cf.id,
            notes: `Réception ${cf.numero}`,
          },
        });
      }
    }

    const lignesApres = await tx.ligneCommandeFournisseur.findMany({ where: { commandeFournisseurId: id } });
    const toutesRecues = lignesApres.every((l) => Number(l.quantiteRecue) >= Number(l.quantiteCommandee) - 1e-6);
    const auMoinsUneRecue = lignesApres.some((l) => Number(l.quantiteRecue) > 0);
    const nouveauStatut: StatutCommandeFournisseur = toutesRecues ? 'RECUE' : auMoinsUneRecue ? 'PARTIELLEMENT_RECUE' : cf.statut;
    if (nouveauStatut !== cf.statut) {
      await tx.commandeFournisseur.update({ where: { id }, data: { statut: nouveauStatut } });
    }
  });

  return getCommandeFournisseur(id);
}

// Résumé pour la bannière de synthèse en tête de la liste — répartition par
// statut + montant total des commandes encore en cours (pas encore reçues
// ni annulées).
const STATUTS_EN_COURS: StatutCommandeFournisseur[] = ['BROUILLON', 'ENVOYEE', 'PARTIELLEMENT_RECUE'];

export async function getResume() {
  const [parStatutRaw, enCours] = await Promise.all([
    prisma.commandeFournisseur.groupBy({ by: ['statut'], _count: true }),
    prisma.commandeFournisseur.findMany({
      where: { statut: { in: STATUTS_EN_COURS } },
      select: { tauxTva: true, lignes: { select: { quantiteCommandee: true, prixUnitaire: true } } },
    }),
  ]);

  const parStatut = parStatutRaw.map((s) => ({ statut: s.statut, nombre: s._count }));
  const total = parStatut.reduce((sum, s) => sum + s.nombre, 0);
  const montantEnCours = enCours.reduce((sum, cf) => {
    const lignesPourCalcul = cf.lignes.map((l) => ({ quantite: l.quantiteCommandee, prixUnitaire: l.prixUnitaire }));
    return sum + computeTotaux(lignesPourCalcul, cf.tauxTva).montantTTC;
  }, 0);

  return { total, parStatut, montantEnCours: Math.round(montantEnCours * 100) / 100 };
}
