import { Prisma } from '@prisma/client';
import { prisma } from '../../db/client';
import { AppError } from '../../middleware/errorHandler';
import { computeSoldeCompte } from '../../lib/tresorerie';
import { type PaginationParams, toPaginatedResult } from '../../lib/pagination';
import type { CreateCompteInput, UpdateCompteInput } from './schema';

async function withSolde<T extends { id: string; soldeInitial: Prisma.Decimal }>(compte: T) {
  const [paiements, mouvements] = await Promise.all([
    prisma.paiement.findMany({ where: { compteId: compte.id }, select: { montant: true } }),
    prisma.mouvementTresorerie.findMany({ where: { compteId: compte.id }, select: { sens: true, statut: true, montant: true } }),
  ]);
  return { ...compte, solde: computeSoldeCompte(compte.soldeInitial, paiements, mouvements) };
}

export async function listComptes(params: PaginationParams, filters: { includeInactifs: boolean }) {
  const where: Prisma.CompteTresorerieWhereInput = {
    ...(filters.includeInactifs ? {} : { actif: true }),
    ...(params.q ? { OR: [{ nom: { contains: params.q, mode: 'insensitive' } }, { banque: { contains: params.q, mode: 'insensitive' } }] } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.compteTresorerie.findMany({ where, orderBy: { nom: 'asc' }, skip: params.skip, take: params.pageSize }),
    prisma.compteTresorerie.count({ where }),
  ]);

  const withSums = await Promise.all(items.map(withSolde));
  return toPaginatedResult(withSums, total, params);
}

async function fetchCompteOrThrow(id: string) {
  const compte = await prisma.compteTresorerie.findUnique({ where: { id } });
  if (!compte) throw new AppError(404, 'Compte introuvable.');
  return compte;
}

export async function getCompte(id: string) {
  const compte = await fetchCompteOrThrow(id);
  return withSolde(compte);
}

export async function createCompte(data: CreateCompteInput) {
  return prisma.compteTresorerie.create({ data });
}

export async function updateCompte(id: string, data: UpdateCompteInput) {
  await fetchCompteOrThrow(id);
  return prisma.compteTresorerie.update({ where: { id }, data });
}

export async function deactivateCompte(id: string) {
  await fetchCompteOrThrow(id);
  return prisma.compteTresorerie.update({ where: { id }, data: { actif: false } });
}

export async function reactivateCompte(id: string) {
  await fetchCompteOrThrow(id);
  return prisma.compteTresorerie.update({ where: { id }, data: { actif: true } });
}
