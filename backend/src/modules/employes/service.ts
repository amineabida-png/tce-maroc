import { Prisma } from '@prisma/client';
import { prisma } from '../../db/client';
import { AppError } from '../../middleware/errorHandler';
import { type PaginationParams, toPaginatedResult } from '../../lib/pagination';
import type { CreateEmployeInput, UpdateEmployeInput } from './schema';

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

export async function listEmployes(params: PaginationParams, includeInactifs: boolean) {
  const where: Prisma.EmployeWhereInput = {
    ...(includeInactifs ? {} : { actif: true }),
    ...(params.q
      ? {
          OR: [
            { nom: { contains: params.q, mode: 'insensitive' } },
            { prenom: { contains: params.q, mode: 'insensitive' } },
            { poste: { contains: params.q, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.employe.findMany({ where, orderBy: { nom: 'asc' }, skip: params.skip, take: params.pageSize }),
    prisma.employe.count({ where }),
  ]);

  return toPaginatedResult(items, total, params);
}

async function fetchEmployeOrThrow(id: string) {
  const employe = await prisma.employe.findUnique({ where: { id } });
  if (!employe) throw new AppError(404, 'Employé introuvable.');
  return employe;
}

export async function getEmploye(id: string) {
  return fetchEmployeOrThrow(id);
}

export async function createEmploye(data: CreateEmployeInput) {
  return prisma.employe.create({
    data: { ...data, dateEmbauche: normalizeDate(data.dateEmbauche) ?? null, email: normalizeEmptyToNull(data.email) ?? null },
  });
}

export async function updateEmploye(id: string, data: UpdateEmployeInput) {
  await fetchEmployeOrThrow(id);
  return prisma.employe.update({
    where: { id },
    data: { ...data, dateEmbauche: normalizeDate(data.dateEmbauche), email: normalizeEmptyToNull(data.email) },
  });
}

export async function deactivateEmploye(id: string) {
  await fetchEmployeOrThrow(id);
  return prisma.employe.update({ where: { id }, data: { actif: false } });
}

export async function reactivateEmploye(id: string) {
  await fetchEmployeOrThrow(id);
  return prisma.employe.update({ where: { id }, data: { actif: true } });
}

export interface LignePaie {
  nom: string;
  prenom: string;
  cnss: string;
  poste: string;
  typeContrat: string;
  joursPresent: number;
  joursAbsent: number;
  joursConge: number;
  joursMaladie: number;
  totalHeures: number;
  tauxHoraire: number;
  montantDu: number;
}

// "Base pour paie" au sens de l'énoncé : pas de moteur de paie complet, un
// export exploitable (heures, taux, CNSS) par employé sur une période.
export async function computePaie(debut: Date, fin: Date): Promise<LignePaie[]> {
  const employes = await prisma.employe.findMany({
    where: { actif: true },
    orderBy: { nom: 'asc' },
    include: { pointages: { where: { date: { gte: debut, lte: fin } } } },
  });

  return employes.map((e) => {
    const joursPresent = e.pointages.filter((p) => p.statut === 'PRESENT').length;
    const joursAbsent = e.pointages.filter((p) => p.statut === 'ABSENT').length;
    const joursConge = e.pointages.filter((p) => p.statut === 'CONGE').length;
    const joursMaladie = e.pointages.filter((p) => p.statut === 'MALADIE').length;
    const totalHeures = e.pointages
      .filter((p) => p.statut === 'PRESENT')
      .reduce((sum, p) => sum + Number(p.nombreHeures ?? 0), 0);
    const tauxHoraire = Number(e.tauxHoraire ?? 0);
    const montantDu = Math.round(totalHeures * tauxHoraire * 100) / 100;

    return {
      nom: e.nom,
      prenom: e.prenom,
      cnss: e.cnss ?? '',
      poste: e.poste ?? '',
      typeContrat: e.typeContrat,
      joursPresent,
      joursAbsent,
      joursConge,
      joursMaladie,
      totalHeures,
      tauxHoraire,
      montantDu,
    };
  });
}
