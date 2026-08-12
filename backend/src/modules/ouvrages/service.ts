import { Prisma } from '@prisma/client';
import { prisma } from '../../db/client';
import { AppError } from '../../middleware/errorHandler';
import { type PaginationParams, toPaginatedResult } from '../../lib/pagination';
import type { CreateOuvrageInput, UpdateOuvrageInput } from './schema';

export async function listOuvrages(params: PaginationParams, includeInactifs: boolean) {
  const where: Prisma.OuvrageWhereInput = {
    ...(includeInactifs ? {} : { actif: true }),
    ...(params.q
      ? {
          OR: [
            { designation: { contains: params.q, mode: 'insensitive' } },
            { corpsDetat: { contains: params.q, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.ouvrage.findMany({ where, orderBy: [{ corpsDetat: 'asc' }, { designation: 'asc' }], skip: params.skip, take: params.pageSize }),
    prisma.ouvrage.count({ where }),
  ]);

  return toPaginatedResult(items, total, params);
}

export async function getOuvrage(id: string) {
  const ouvrage = await prisma.ouvrage.findUnique({ where: { id } });
  if (!ouvrage) throw new AppError(404, 'Ouvrage introuvable.');
  return ouvrage;
}

export async function createOuvrage(data: CreateOuvrageInput) {
  return prisma.ouvrage.create({ data });
}

export async function updateOuvrage(id: string, data: UpdateOuvrageInput) {
  await getOuvrage(id);
  return prisma.ouvrage.update({ where: { id }, data });
}

export async function deactivateOuvrage(id: string) {
  await getOuvrage(id);
  return prisma.ouvrage.update({ where: { id }, data: { actif: false } });
}

export async function reactivateOuvrage(id: string) {
  await getOuvrage(id);
  return prisma.ouvrage.update({ where: { id }, data: { actif: true } });
}
