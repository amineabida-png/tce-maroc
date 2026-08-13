import { Prisma } from '@prisma/client';
import { prisma } from '../../db/client';
import { AppError } from '../../middleware/errorHandler';
import { type PaginationParams, toPaginatedResult } from '../../lib/pagination';
import type { CreateClientInput, UpdateClientInput } from './schema';

export async function listClients(params: PaginationParams, includeInactifs: boolean) {
  const where: Prisma.ClientWhereInput = {
    ...(includeInactifs ? {} : { actif: true }),
    ...(params.q
      ? {
          OR: [
            { nom: { contains: params.q, mode: 'insensitive' } },
            { ice: { contains: params.q, mode: 'insensitive' } },
            { ville: { contains: params.q, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.client.findMany({ where, orderBy: { nom: 'asc' }, skip: params.skip, take: params.pageSize }),
    prisma.client.count({ where }),
  ]);

  return toPaginatedResult(items, total, params);
}

export async function getClient(id: string) {
  const client = await prisma.client.findUnique({ where: { id } });
  if (!client) throw new AppError(404, 'Client introuvable.');
  return client;
}

// '' (champ vidé par l'utilisateur) doit devenir null ; undefined (champ
// absent d'une mise à jour partielle) doit rester undefined pour que Prisma
// n'y touche pas — un `|| null` naïf confondrait les deux cas.
function normalizeEmail(email: string | null | undefined): string | null | undefined {
  if (email === undefined) return undefined;
  return email || null;
}

export async function createClient(data: CreateClientInput) {
  return prisma.client.create({ data: { ...data, email: normalizeEmail(data.email) ?? null } });
}

export async function updateClient(id: string, data: UpdateClientInput) {
  await getClient(id);
  return prisma.client.update({ where: { id }, data: { ...data, email: normalizeEmail(data.email) } });
}

// Suppression douce : un client peut être référencé par des chantiers/devis
// une fois ces modules en place — on ne supprime jamais la ligne, on la
// désactive (elle disparaît des listes actives mais reste consultable).
export async function deactivateClient(id: string) {
  await getClient(id);
  return prisma.client.update({ where: { id }, data: { actif: false } });
}

export async function reactivateClient(id: string) {
  await getClient(id);
  return prisma.client.update({ where: { id }, data: { actif: true } });
}

// Résumé pour la bannière de synthèse en tête de la liste des clients.
export async function getResume() {
  const parTypeRaw = await prisma.client.groupBy({ by: ['type'], where: { actif: true }, _count: true });
  const parType = parTypeRaw.map((t) => ({ type: t.type, nombre: t._count }));
  const total = parType.reduce((sum, t) => sum + t.nombre, 0);
  return { total, parType };
}
