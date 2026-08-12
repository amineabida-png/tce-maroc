import { Prisma } from '@prisma/client';
import { prisma } from '../../db/client';
import { AppError } from '../../middleware/errorHandler';
import { type PaginationParams, toPaginatedResult } from '../../lib/pagination';
import type { CreateSousTraitantInput, UpdateSousTraitantInput } from './schema';

function normalizeEmail(email: string | null | undefined): string | null | undefined {
  if (email === undefined) return undefined;
  return email || null;
}

export async function listSousTraitants(params: PaginationParams, includeInactifs: boolean) {
  const where: Prisma.SousTraitantWhereInput = {
    ...(includeInactifs ? {} : { actif: true }),
    ...(params.q
      ? {
          OR: [
            { nom: { contains: params.q, mode: 'insensitive' } },
            { ice: { contains: params.q, mode: 'insensitive' } },
            { corpsDetat: { contains: params.q, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.sousTraitant.findMany({ where, orderBy: { nom: 'asc' }, skip: params.skip, take: params.pageSize }),
    prisma.sousTraitant.count({ where }),
  ]);

  return toPaginatedResult(items, total, params);
}

export async function getSousTraitant(id: string) {
  const sousTraitant = await prisma.sousTraitant.findUnique({ where: { id } });
  if (!sousTraitant) throw new AppError(404, 'Sous-traitant introuvable.');
  return sousTraitant;
}

export async function createSousTraitant(data: CreateSousTraitantInput) {
  return prisma.sousTraitant.create({ data: { ...data, email: normalizeEmail(data.email) ?? null } });
}

export async function updateSousTraitant(id: string, data: UpdateSousTraitantInput) {
  await getSousTraitant(id);
  return prisma.sousTraitant.update({ where: { id }, data: { ...data, email: normalizeEmail(data.email) } });
}

export async function deactivateSousTraitant(id: string) {
  await getSousTraitant(id);
  return prisma.sousTraitant.update({ where: { id }, data: { actif: false } });
}

export async function reactivateSousTraitant(id: string) {
  await getSousTraitant(id);
  return prisma.sousTraitant.update({ where: { id }, data: { actif: true } });
}
