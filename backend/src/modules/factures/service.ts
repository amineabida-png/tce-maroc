import { Prisma, type StatutFacture } from '@prisma/client';
import { prisma } from '../../db/client';
import { AppError } from '../../middleware/errorHandler';
import { computeTotaux } from '../../lib/money';
import { nextNumero } from '../../lib/numerotation';
import { type PaginationParams, toPaginatedResult } from '../../lib/pagination';
import { getSociete } from '../societe/service';
import type { CreatePaiementInput, FactureContentInput } from './schema';

function normalizeEmptyToNull<T>(value: T | '' | null | undefined): T | null | undefined {
  if (value === undefined) return undefined;
  if (value === '') return null;
  return value as T;
}
function normalizeDate(value: string | null | undefined | ''): Date | null | undefined {
  const v = normalizeEmptyToNull(value);
  if (v === undefined || v === null) return v;
  return new Date(v);
}

const STATUTS_MODIFIABLES: StatutFacture[] = ['BROUILLON'];

const FACTURE_INCLUDE = {
  client: { select: { id: true, nom: true } },
  chantier: { select: { id: true, nom: true } },
  devis: { select: { id: true, numero: true } },
  commande: { select: { id: true, numero: true } },
  lignes: { orderBy: { ordre: 'asc' } },
  paiements: { orderBy: [{ date: 'desc' }, { createdAt: 'desc' }] },
} satisfies Prisma.FactureInclude;

function withTotaux<
  T extends {
    tauxTva: Prisma.Decimal;
    tauxRetenueGarantie: Prisma.Decimal;
    dateEcheance: Date | null;
    statut: StatutFacture;
    lignes: { quantite: Prisma.Decimal; prixUnitaire: Prisma.Decimal }[];
    paiements?: { montant: Prisma.Decimal }[];
  },
>(facture: T) {
  const totaux = computeTotaux(facture.lignes, facture.tauxTva, facture.tauxRetenueGarantie);
  const montantPaye = (facture.paiements ?? []).reduce((sum, p) => sum + Number(p.montant), 0);
  const montantRestantDu = Math.round((totaux.montantNetAPayer - montantPaye) * 100) / 100;
  const enRetard =
    facture.dateEcheance != null &&
    facture.dateEcheance.getTime() < Date.now() &&
    ['ENVOYEE', 'PARTIELLEMENT_PAYEE'].includes(facture.statut);
  return { ...facture, totaux, montantPaye, montantRestantDu, enRetard };
}

export async function listFactures(
  params: PaginationParams,
  filters: { statut?: string; clientId?: string; chantierId?: string; impayeesUniquement?: boolean }
) {
  const where: Prisma.FactureWhereInput = {
    ...(filters.statut ? { statut: filters.statut as StatutFacture } : {}),
    ...(filters.clientId ? { clientId: filters.clientId } : {}),
    ...(filters.chantierId ? { chantierId: filters.chantierId } : {}),
    ...(filters.impayeesUniquement ? { statut: { in: ['ENVOYEE', 'PARTIELLEMENT_PAYEE'] } } : {}),
    ...(params.q
      ? { OR: [{ numero: { contains: params.q, mode: 'insensitive' } }, { client: { nom: { contains: params.q, mode: 'insensitive' } } }] }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.facture.findMany({
      where,
      orderBy: { date: 'desc' },
      skip: params.skip,
      take: params.pageSize,
      include: {
        client: { select: { id: true, nom: true } },
        chantier: { select: { id: true, nom: true } },
        lignes: true,
        paiements: { select: { montant: true } },
      },
    }),
    prisma.facture.count({ where }),
  ]);

  return toPaginatedResult(
    items.map((f) => withTotaux(f)),
    total,
    params
  );
}

async function fetchFactureOrThrow(id: string) {
  const facture = await prisma.facture.findUnique({ where: { id }, include: FACTURE_INCLUDE });
  if (!facture) throw new AppError(404, 'Facture introuvable.');
  return facture;
}

export async function getFacture(id: string) {
  return withTotaux(await fetchFactureOrThrow(id));
}

export async function createFacture(data: FactureContentInput) {
  const societe = await getSociete();
  const numerotation = societe.numerotations.find((n) => n.typeDocument === 'FACTURE');
  const numero = await nextNumero(societe.id, 'FACTURE', numerotation?.prefixe ?? 'FACT');

  const factureId = await prisma.$transaction(async (tx) => {
    const facture = await tx.facture.create({
      data: {
        numero,
        type: data.type ?? 'FACTURE',
        clientId: data.clientId,
        chantierId: normalizeEmptyToNull(data.chantierId) ?? null,
        dateEcheance: normalizeDate(data.dateEcheance) ?? null,
        tauxTva: data.tauxTva ?? societe.tauxTvaDefaut,
        tauxRetenueGarantie: data.tauxRetenueGarantie ?? societe.tauxRetenueGarantie,
      },
    });
    for (let i = 0; i < data.lignes.length; i++) {
      const ligne = data.lignes[i]!;
      await tx.ligneFacture.create({ data: { factureId: facture.id, ordre: i, ...ligne } });
    }
    return facture.id;
  });

  return getFacture(factureId);
}

export async function updateFacture(id: string, data: FactureContentInput) {
  const existing = await prisma.facture.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, 'Facture introuvable.');
  if (!STATUTS_MODIFIABLES.includes(existing.statut)) {
    throw new AppError(409, 'Cette facture ne peut plus être modifiée (déjà envoyée, payée ou annulée).');
  }

  await prisma.$transaction(async (tx) => {
    await tx.ligneFacture.deleteMany({ where: { factureId: id } });
    await tx.facture.update({
      where: { id },
      data: {
        type: data.type,
        clientId: data.clientId,
        chantierId: normalizeEmptyToNull(data.chantierId) ?? null,
        dateEcheance: normalizeDate(data.dateEcheance),
        tauxTva: data.tauxTva,
        tauxRetenueGarantie: data.tauxRetenueGarantie,
      },
    });
    for (let i = 0; i < data.lignes.length; i++) {
      const ligne = data.lignes[i]!;
      await tx.ligneFacture.create({ data: { factureId: id, ordre: i, ...ligne } });
    }
  });

  return getFacture(id);
}

export async function deleteFacture(id: string): Promise<void> {
  const facture = await prisma.facture.findUnique({ where: { id } });
  if (!facture) throw new AppError(404, 'Facture introuvable.');
  if (facture.statut !== 'BROUILLON') throw new AppError(409, 'Seule une facture en brouillon peut être supprimée.');
  await prisma.facture.delete({ where: { id } });
}

export async function envoyerFacture(id: string) {
  const facture = await prisma.facture.findUnique({ where: { id } });
  if (!facture) throw new AppError(404, 'Facture introuvable.');
  if (facture.statut !== 'BROUILLON') throw new AppError(409, 'Seule une facture en brouillon peut être envoyée.');
  await prisma.facture.update({ where: { id }, data: { statut: 'ENVOYEE' } });
  return getFacture(id);
}

export async function annulerFacture(id: string) {
  const facture = await prisma.facture.findUnique({ where: { id }, include: { paiements: true } });
  if (!facture) throw new AppError(404, 'Facture introuvable.');
  if (facture.paiements.length > 0) {
    throw new AppError(409, 'Impossible d’annuler une facture ayant déjà reçu des paiements.');
  }
  if (!['BROUILLON', 'ENVOYEE'].includes(facture.statut)) {
    throw new AppError(409, 'Cette facture ne peut pas être annulée dans son état actuel.');
  }
  await prisma.facture.update({ where: { id }, data: { statut: 'ANNULEE' } });
  return getFacture(id);
}

// Recalcule le statut de paiement à partir des paiements réels — jamais
// laissé à une saisie manuelle qui pourrait se désynchroniser.
async function recalculerStatutPaiement(tx: Prisma.TransactionClient, factureId: string): Promise<void> {
  const facture = await tx.facture.findUniqueOrThrow({ where: { id: factureId }, include: { lignes: true, paiements: true } });
  if (facture.statut === 'BROUILLON' || facture.statut === 'ANNULEE') return;

  const totaux = computeTotaux(facture.lignes, facture.tauxTva, facture.tauxRetenueGarantie);
  const totalPaye = facture.paiements.reduce((sum, p) => sum + Number(p.montant), 0);

  let nouveauStatut: StatutFacture;
  if (totalPaye <= 0) nouveauStatut = 'ENVOYEE';
  else if (totalPaye < totaux.montantNetAPayer) nouveauStatut = 'PARTIELLEMENT_PAYEE';
  else nouveauStatut = 'PAYEE';

  if (nouveauStatut !== facture.statut) {
    await tx.facture.update({ where: { id: factureId }, data: { statut: nouveauStatut } });
  }
}

export async function addPaiement(factureId: string, data: CreatePaiementInput) {
  const facture = await prisma.facture.findUnique({ where: { id: factureId } });
  if (!facture) throw new AppError(404, 'Facture introuvable.');
  if (facture.statut === 'BROUILLON') throw new AppError(409, 'Envoyez la facture avant d’enregistrer un paiement.');
  if (facture.statut === 'ANNULEE') throw new AppError(409, 'Impossible d’enregistrer un paiement sur une facture annulée.');

  await prisma.$transaction(async (tx) => {
    await tx.paiement.create({
      data: {
        factureId,
        montant: data.montant,
        date: new Date(data.date),
        mode: data.mode,
        reference: data.reference,
      },
    });
    await recalculerStatutPaiement(tx, factureId);
  });

  return getFacture(factureId);
}

export async function deletePaiement(factureId: string, paiementId: string) {
  const paiement = await prisma.paiement.findFirst({ where: { id: paiementId, factureId } });
  if (!paiement) throw new AppError(404, 'Paiement introuvable.');

  await prisma.$transaction(async (tx) => {
    await tx.paiement.delete({ where: { id: paiementId } });
    await recalculerStatutPaiement(tx, factureId);
  });

  return getFacture(factureId);
}
