import { Prisma, type SensMouvement, type StatutMouvement } from '@prisma/client';
import { prisma } from '../../db/client';
import { AppError } from '../../middleware/errorHandler';
import { type PaginationParams, toPaginatedResult } from '../../lib/pagination';
import { listFactures } from '../factures/service';
import type { CreateMouvementInput, UpdateMouvementInput } from './schema';

function normalizeEmptyToNull<T>(value: T | '' | null | undefined): T | null | undefined {
  if (value === undefined) return undefined;
  if (value === '') return null;
  return value as T;
}

const MOUVEMENT_INCLUDE = {
  compte: { select: { id: true, nom: true, type: true } },
  chantier: { select: { id: true, nom: true } },
  fournisseur: { select: { id: true, nom: true } },
  sousTraitant: { select: { id: true, nom: true } },
} satisfies Prisma.MouvementTresorerieInclude;

function toCreateData(data: CreateMouvementInput) {
  return {
    compteId: data.compteId,
    sens: data.sens,
    statut: data.statut,
    montant: data.montant,
    date: new Date(data.date),
    modePaiement: data.modePaiement,
    reference: data.reference,
    description: data.description,
    chantierId: normalizeEmptyToNull(data.chantierId) ?? null,
    fournisseurId: normalizeEmptyToNull(data.fournisseurId) ?? null,
    sousTraitantId: normalizeEmptyToNull(data.sousTraitantId) ?? null,
  };
}

export async function listMouvements(
  params: PaginationParams,
  filters: { compteId?: string; sens?: string; statut?: string; chantierId?: string; debut?: string; fin?: string }
) {
  const where: Prisma.MouvementTresorerieWhereInput = {
    ...(filters.compteId ? { compteId: filters.compteId } : {}),
    ...(filters.sens ? { sens: filters.sens as SensMouvement } : {}),
    ...(filters.statut ? { statut: filters.statut as StatutMouvement } : {}),
    ...(filters.chantierId ? { chantierId: filters.chantierId } : {}),
    ...(filters.debut && filters.fin ? { date: { gte: new Date(filters.debut), lte: new Date(filters.fin) } } : {}),
    ...(params.q ? { OR: [{ description: { contains: params.q, mode: 'insensitive' } }, { reference: { contains: params.q, mode: 'insensitive' } }] } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.mouvementTresorerie.findMany({
      where,
      orderBy: { date: 'desc' },
      skip: params.skip,
      take: params.pageSize,
      include: MOUVEMENT_INCLUDE,
    }),
    prisma.mouvementTresorerie.count({ where }),
  ]);

  return toPaginatedResult(items, total, params);
}

async function fetchMouvementOrThrow(id: string) {
  const mouvement = await prisma.mouvementTresorerie.findUnique({ where: { id } });
  if (!mouvement) throw new AppError(404, 'Mouvement introuvable.');
  return mouvement;
}

export async function getMouvement(id: string) {
  await fetchMouvementOrThrow(id);
  return prisma.mouvementTresorerie.findUniqueOrThrow({ where: { id }, include: MOUVEMENT_INCLUDE });
}

export async function createMouvement(data: CreateMouvementInput) {
  const mouvement = await prisma.mouvementTresorerie.create({ data: toCreateData(data), include: MOUVEMENT_INCLUDE });
  return mouvement;
}

export async function updateMouvement(id: string, data: UpdateMouvementInput) {
  const mouvement = await fetchMouvementOrThrow(id);
  if (mouvement.rapproche) throw new AppError(409, 'Impossible de modifier un mouvement déjà rapproché.');
  return prisma.mouvementTresorerie.update({
    where: { id },
    data: {
      ...data,
      date: data.date ? new Date(data.date) : undefined,
      chantierId: normalizeEmptyToNull(data.chantierId),
      fournisseurId: normalizeEmptyToNull(data.fournisseurId),
      sousTraitantId: normalizeEmptyToNull(data.sousTraitantId),
    },
    include: MOUVEMENT_INCLUDE,
  });
}

export async function deleteMouvement(id: string): Promise<void> {
  const mouvement = await fetchMouvementOrThrow(id);
  if (mouvement.rapproche) throw new AppError(409, 'Impossible de supprimer un mouvement déjà rapproché.');
  await prisma.mouvementTresorerie.delete({ where: { id } });
}

export async function rapprocherMouvement(id: string, rapproche: boolean) {
  await fetchMouvementOrThrow(id);
  return prisma.mouvementTresorerie.update({
    where: { id },
    data: { rapproche, dateRapprochement: rapproche ? new Date() : null },
    include: MOUVEMENT_INCLUDE,
  });
}

// Journal de trésorerie : fusionne les paiements clients rattachés à un
// compte (déjà suivis via Facture/Paiement) et les mouvements réalisés — pas
// de duplication, juste une vue chronologique unifiée.
export async function getJournal(filters: { compteId?: string; debut?: string; fin?: string }) {
  const dateFilter =
    filters.debut && filters.fin ? { gte: new Date(filters.debut), lte: new Date(filters.fin) } : undefined;

  const [paiements, mouvements] = await Promise.all([
    prisma.paiement.findMany({
      where: {
        compteId: filters.compteId ? filters.compteId : { not: null },
        ...(dateFilter ? { date: dateFilter } : {}),
      },
      include: { facture: { select: { id: true, numero: true, client: { select: { nom: true } } } } },
      orderBy: { date: 'desc' },
    }),
    prisma.mouvementTresorerie.findMany({
      where: {
        statut: 'REALISE',
        ...(filters.compteId ? { compteId: filters.compteId } : {}),
        ...(dateFilter ? { date: dateFilter } : {}),
      },
      include: MOUVEMENT_INCLUDE,
      orderBy: { date: 'desc' },
    }),
  ]);

  const entries = [
    ...paiements.map((p) => ({
      id: p.id,
      source: 'PAIEMENT_CLIENT' as const,
      sens: 'ENCAISSEMENT' as const,
      compteId: p.compteId,
      montant: Number(p.montant),
      date: p.date,
      modePaiement: p.mode,
      reference: p.reference,
      description: `Paiement facture ${p.facture.numero} — ${p.facture.client.nom}`,
      rapproche: null as boolean | null,
    })),
    ...mouvements.map((m) => ({
      id: m.id,
      source: 'MOUVEMENT' as const,
      sens: m.sens,
      compteId: m.compteId,
      montant: Number(m.montant),
      date: m.date,
      modePaiement: m.modePaiement,
      reference: m.reference,
      description: m.description || m.chantier?.nom || m.fournisseur?.nom || m.sousTraitant?.nom || '',
      rapproche: m.rapproche,
    })),
  ];

  entries.sort((a, b) => b.date.getTime() - a.date.getTime());
  return entries;
}

// Échéancier : encaissements à venir (factures clients non soldées, déjà
// calculées par le module Facturation) + décaissements planifiés (saisis
// manuellement en statut PREVU) — deux sources distinctes, pas de nouvelle
// logique de calcul dupliquée.
export async function getEcheancier() {
  const facturesImpayees = await listFactures(
    { page: 1, pageSize: 100, skip: 0, q: '' },
    { impayeesUniquement: true }
  );

  const decaissementsPrevus = await prisma.mouvementTresorerie.findMany({
    where: { statut: 'PREVU' },
    include: MOUVEMENT_INCLUDE,
    orderBy: { date: 'asc' },
  });

  const encaissementsPrevus = facturesImpayees.items
    .filter((f) => f.dateEcheance)
    .map((f) => ({
      id: f.id,
      numero: f.numero,
      client: f.client.nom,
      dateEcheance: f.dateEcheance,
      montant: f.montantRestantDu,
      enRetard: f.enRetard,
    }))
    .sort((a, b) => new Date(a.dateEcheance as unknown as string).getTime() - new Date(b.dateEcheance as unknown as string).getTime());

  return { encaissementsPrevus, decaissementsPrevus };
}
