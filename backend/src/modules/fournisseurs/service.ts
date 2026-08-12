import { Prisma } from '@prisma/client';
import { prisma } from '../../db/client';
import { AppError } from '../../middleware/errorHandler';
import { type PaginationParams, toPaginatedResult } from '../../lib/pagination';
import type { CreateFournisseurInput, UpdateFournisseurInput } from './schema';

function normalizeEmail(email: string | null | undefined): string | null | undefined {
  if (email === undefined) return undefined;
  return email || null;
}

export async function listFournisseurs(params: PaginationParams, includeInactifs: boolean) {
  const where: Prisma.FournisseurWhereInput = {
    ...(includeInactifs ? {} : { actif: true }),
    ...(params.q
      ? {
          OR: [
            { nom: { contains: params.q, mode: 'insensitive' } },
            { ice: { contains: params.q, mode: 'insensitive' } },
            { categorie: { contains: params.q, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.fournisseur.findMany({ where, orderBy: { nom: 'asc' }, skip: params.skip, take: params.pageSize }),
    prisma.fournisseur.count({ where }),
  ]);

  return toPaginatedResult(items, total, params);
}

export async function getFournisseur(id: string) {
  const fournisseur = await prisma.fournisseur.findUnique({ where: { id } });
  if (!fournisseur) throw new AppError(404, 'Fournisseur introuvable.');
  return fournisseur;
}

export async function createFournisseur(data: CreateFournisseurInput) {
  return prisma.fournisseur.create({ data: { ...data, email: normalizeEmail(data.email) ?? null } });
}

export async function updateFournisseur(id: string, data: UpdateFournisseurInput) {
  await getFournisseur(id);
  return prisma.fournisseur.update({ where: { id }, data: { ...data, email: normalizeEmail(data.email) } });
}

export async function deactivateFournisseur(id: string) {
  await getFournisseur(id);
  return prisma.fournisseur.update({ where: { id }, data: { actif: false } });
}

export async function reactivateFournisseur(id: string) {
  await getFournisseur(id);
  return prisma.fournisseur.update({ where: { id }, data: { actif: true } });
}
