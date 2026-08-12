import { Prisma, type StatutChantier } from '@prisma/client';
import { prisma } from '../../db/client';
import { AppError } from '../../middleware/errorHandler';
import { type PaginationParams, toPaginatedResult } from '../../lib/pagination';
import type {
  CreateChantierInput,
  CreateDepenseInput,
  CreateTacheInput,
  UpdateChantierInput,
  UpdateTacheInput,
} from './schema';

// '' (sélection vidée dans un <select>) doit devenir null ; undefined
// (champ absent d'une mise à jour partielle) doit rester undefined pour que
// Prisma n'y touche pas.
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

async function ensureChantierExists(id: string): Promise<void> {
  const exists = await prisma.chantier.findUnique({ where: { id }, select: { id: true } });
  if (!exists) throw new AppError(404, 'Chantier introuvable.');
}

const CHANTIER_LIST_INCLUDE = {
  client: { select: { id: true, nom: true } },
  conducteur: { select: { id: true, nom: true, prenom: true } },
} satisfies Prisma.ChantierInclude;

export async function listChantiers(
  params: PaginationParams,
  filters: { statut?: string; includeInactifs: boolean }
) {
  const where: Prisma.ChantierWhereInput = {
    ...(filters.includeInactifs ? {} : { actif: true }),
    ...(filters.statut ? { statut: filters.statut as StatutChantier } : {}),
    ...(params.q
      ? {
          OR: [
            { nom: { contains: params.q, mode: 'insensitive' } },
            { ville: { contains: params.q, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.chantier.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: params.skip,
      take: params.pageSize,
      include: CHANTIER_LIST_INCLUDE,
    }),
    prisma.chantier.count({ where }),
  ]);

  return toPaginatedResult(items, total, params);
}

export async function getChantier(id: string) {
  const chantier = await prisma.chantier.findUnique({
    where: { id },
    include: {
      ...CHANTIER_LIST_INCLUDE,
      taches: { orderBy: { ordre: 'asc' } },
    },
  });
  if (!chantier) throw new AppError(404, 'Chantier introuvable.');
  return chantier;
}

export async function createChantier(data: CreateChantierInput) {
  return prisma.chantier.create({
    data: {
      nom: data.nom,
      clientId: normalizeEmptyToNull(data.clientId) ?? null,
      adresse: data.adresse,
      ville: data.ville,
      budgetPrevisionnel: data.budgetPrevisionnel ?? null,
      dateDebut: normalizeDate(data.dateDebut) ?? null,
      dateFinPrevue: normalizeDate(data.dateFinPrevue) ?? null,
      dateFinReelle: normalizeDate(data.dateFinReelle) ?? null,
      avancement: data.avancement ?? 0,
      statut: data.statut ?? 'EN_PREPARATION',
      conducteurId: normalizeEmptyToNull(data.conducteurId) ?? null,
      description: data.description,
    },
    include: CHANTIER_LIST_INCLUDE,
  });
}

export async function updateChantier(id: string, data: UpdateChantierInput) {
  await ensureChantierExists(id);
  return prisma.chantier.update({
    where: { id },
    data: {
      ...data,
      clientId: normalizeEmptyToNull(data.clientId),
      conducteurId: normalizeEmptyToNull(data.conducteurId),
      dateDebut: normalizeDate(data.dateDebut),
      dateFinPrevue: normalizeDate(data.dateFinPrevue),
      dateFinReelle: normalizeDate(data.dateFinReelle),
    },
    include: CHANTIER_LIST_INCLUDE,
  });
}

export async function deactivateChantier(id: string) {
  await ensureChantierExists(id);
  return prisma.chantier.update({ where: { id }, data: { actif: false } });
}

export async function reactivateChantier(id: string) {
  await ensureChantierExists(id);
  return prisma.chantier.update({ where: { id }, data: { actif: true } });
}

// Le budget "réel" n'est jamais stocké : il se recalcule à partir des
// DepenseChantier existantes, pour ne jamais se désynchroniser.
export async function getBudgetSummary(chantierId: string) {
  const chantier = await prisma.chantier.findUnique({
    where: { id: chantierId },
    select: { budgetPrevisionnel: true },
  });
  if (!chantier) throw new AppError(404, 'Chantier introuvable.');

  const parCategorieRaw = await prisma.depenseChantier.groupBy({
    by: ['categorie'],
    where: { chantierId },
    _sum: { montant: true },
  });

  const parCategorie = parCategorieRaw.map((d) => ({
    categorie: d.categorie,
    montant: Number(d._sum.montant ?? 0),
  }));
  const totalReel = parCategorie.reduce((sum, d) => sum + d.montant, 0);
  const budgetPrevisionnel = chantier.budgetPrevisionnel ? Number(chantier.budgetPrevisionnel) : null;
  const ecart = budgetPrevisionnel !== null ? budgetPrevisionnel - totalReel : null;

  return { budgetPrevisionnel, totalReel, ecart, parCategorie };
}

/* ============================ TÂCHES ============================ */

export async function listTaches(chantierId: string) {
  await ensureChantierExists(chantierId);
  return prisma.tacheChantier.findMany({ where: { chantierId }, orderBy: { ordre: 'asc' } });
}

export async function createTache(chantierId: string, data: CreateTacheInput) {
  await ensureChantierExists(chantierId);
  return prisma.tacheChantier.create({
    data: {
      chantierId,
      nom: data.nom,
      dateDebut: normalizeDate(data.dateDebut) ?? null,
      dateFin: normalizeDate(data.dateFin) ?? null,
      avancement: data.avancement ?? 0,
      statut: data.statut ?? 'A_FAIRE',
      ordre: data.ordre ?? 0,
      predecesseurId: normalizeEmptyToNull(data.predecesseurId) ?? null,
    },
  });
}

async function ensureTacheExists(chantierId: string, tacheId: string) {
  const tache = await prisma.tacheChantier.findFirst({ where: { id: tacheId, chantierId } });
  if (!tache) throw new AppError(404, 'Tâche introuvable.');
  return tache;
}

export async function updateTache(chantierId: string, tacheId: string, data: UpdateTacheInput) {
  await ensureTacheExists(chantierId, tacheId);
  return prisma.tacheChantier.update({
    where: { id: tacheId },
    data: {
      ...data,
      dateDebut: normalizeDate(data.dateDebut),
      dateFin: normalizeDate(data.dateFin),
      predecesseurId: normalizeEmptyToNull(data.predecesseurId),
    },
  });
}

export async function deleteTache(chantierId: string, tacheId: string): Promise<void> {
  await ensureTacheExists(chantierId, tacheId);
  await prisma.tacheChantier.delete({ where: { id: tacheId } });
}

/* ============================ DÉPENSES ============================ */

export async function listDepenses(chantierId: string) {
  await ensureChantierExists(chantierId);
  return prisma.depenseChantier.findMany({
    where: { chantierId },
    orderBy: { date: 'desc' },
    include: {
      fournisseur: { select: { id: true, nom: true } },
      sousTraitant: { select: { id: true, nom: true } },
    },
  });
}

export async function createDepense(chantierId: string, data: CreateDepenseInput) {
  await ensureChantierExists(chantierId);
  return prisma.depenseChantier.create({
    data: {
      chantierId,
      categorie: data.categorie,
      montant: data.montant,
      date: new Date(data.date),
      description: data.description,
      fournisseurId: normalizeEmptyToNull(data.fournisseurId) ?? null,
      sousTraitantId: normalizeEmptyToNull(data.sousTraitantId) ?? null,
    },
  });
}

export async function deleteDepense(chantierId: string, depenseId: string): Promise<void> {
  const depense = await prisma.depenseChantier.findFirst({ where: { id: depenseId, chantierId } });
  if (!depense) throw new AppError(404, 'Dépense introuvable.');
  await prisma.depenseChantier.delete({ where: { id: depenseId } });
}
