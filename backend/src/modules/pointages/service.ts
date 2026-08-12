import { Prisma, type StatutPointage } from '@prisma/client';
import { prisma } from '../../db/client';
import { AppError } from '../../middleware/errorHandler';
import { type PaginationParams, toPaginatedResult } from '../../lib/pagination';
import type { UpsertPointageInput } from './schema';

function normalizeEmptyToNull<T>(value: T | '' | null | undefined): T | null | undefined {
  if (value === undefined) return undefined;
  if (value === '') return null;
  return value as T;
}
function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

const POINTAGE_INCLUDE = {
  employe: { select: { id: true, nom: true, prenom: true } },
  chantier: { select: { id: true, nom: true } },
} satisfies Prisma.PointageInclude;

// Un seul pointage par employé et par jour (contrainte unique en base) : un
// nouvel envoi pour le même jour corrige le précédent plutôt que d'en créer
// un second — reflète l'usage réel (le contremaître corrige la feuille du
// jour en cas d'erreur de saisie).
export async function upsertPointage(data: UpsertPointageInput) {
  const date = new Date(data.date);
  const chantierId = normalizeEmptyToNull(data.chantierId) ?? null;

  const employe = await prisma.employe.findUnique({ where: { id: data.employeId } });
  if (!employe) throw new AppError(404, 'Employé introuvable.');

  return prisma.pointage.upsert({
    where: { employeId_date: { employeId: data.employeId, date } },
    create: {
      employeId: data.employeId,
      chantierId,
      date,
      statut: data.statut,
      nombreHeures: data.nombreHeures,
      notes: data.notes,
    },
    update: {
      chantierId,
      statut: data.statut,
      nombreHeures: data.nombreHeures,
      notes: data.notes,
    },
    include: POINTAGE_INCLUDE,
  });
}

export async function listPointages(
  params: PaginationParams,
  filters: { employeId?: string; chantierId?: string; statut?: string; debut?: string; fin?: string }
) {
  const where: Prisma.PointageWhereInput = {
    ...(filters.employeId ? { employeId: filters.employeId } : {}),
    ...(filters.chantierId ? { chantierId: filters.chantierId } : {}),
    ...(filters.statut ? { statut: filters.statut as StatutPointage } : {}),
    ...(filters.debut && filters.fin ? { date: { gte: new Date(filters.debut), lte: new Date(filters.fin) } } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.pointage.findMany({
      where,
      orderBy: { date: 'desc' },
      skip: params.skip,
      take: params.pageSize,
      include: POINTAGE_INCLUDE,
    }),
    prisma.pointage.count({ where }),
  ]);

  return toPaginatedResult(items, total, params);
}

export async function deletePointage(id: string): Promise<void> {
  const pointage = await prisma.pointage.findUnique({ where: { id } });
  if (!pointage) throw new AppError(404, 'Pointage introuvable.');
  await prisma.pointage.delete({ where: { id } });
}

export interface CoutParEmploye {
  employeId: string;
  nom: string;
  prenom: string;
  heures: number;
  cout: number;
}

export interface CoutMainDoeuvre {
  totalHeures: number;
  totalCout: number;
  parEmploye: CoutParEmploye[];
}

// Coût de main-d'œuvre par chantier — jamais stocké, calculé à la demande
// depuis les pointages PRESENT réels (heures × taux horaire de l'employé).
// Volontairement non injecté automatiquement dans DepenseChantier : évite
// tout double-comptage avec une saisie manuelle, reste un rapport
// consultable indépendant.
export async function getCoutMainDoeuvre(chantierId: string, debut?: string, fin?: string): Promise<CoutMainDoeuvre> {
  const where: Prisma.PointageWhereInput = {
    chantierId,
    statut: 'PRESENT',
    ...(debut && fin ? { date: { gte: new Date(debut), lte: new Date(fin) } } : {}),
  };

  const pointages = await prisma.pointage.findMany({
    where,
    include: { employe: { select: { id: true, nom: true, prenom: true, tauxHoraire: true } } },
  });

  const parEmployeMap = new Map<string, CoutParEmploye>();
  let totalHeures = 0;
  let totalCout = 0;

  for (const p of pointages) {
    const heures = Number(p.nombreHeures) || 0;
    const taux = Number(p.employe.tauxHoraire) || 0;
    const cout = heures * taux;
    totalHeures += heures;
    totalCout += cout;

    const existing = parEmployeMap.get(p.employeId) ?? {
      employeId: p.employeId,
      nom: p.employe.nom,
      prenom: p.employe.prenom,
      heures: 0,
      cout: 0,
    };
    existing.heures += heures;
    existing.cout += cout;
    parEmployeMap.set(p.employeId, existing);
  }

  return {
    totalHeures: round2(totalHeures),
    totalCout: round2(totalCout),
    parEmploye: [...parEmployeMap.values()].map((e) => ({ ...e, heures: round2(e.heures), cout: round2(e.cout) })),
  };
}
