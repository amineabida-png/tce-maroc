import { Prisma } from '@prisma/client';
import { prisma } from '../../db/client';
import { type PaginationParams, toPaginatedResult } from '../../lib/pagination';

export async function listJournalAudit(
  params: PaginationParams,
  filters: { utilisateurId?: string; action?: string; entite?: string; debut?: string; fin?: string }
) {
  const where: Prisma.JournalAuditWhereInput = {
    ...(filters.utilisateurId ? { utilisateurId: filters.utilisateurId } : {}),
    ...(filters.action ? { action: { contains: filters.action, mode: 'insensitive' } } : {}),
    ...(filters.entite ? { entite: filters.entite } : {}),
    ...(filters.debut && filters.fin ? { createdAt: { gte: new Date(filters.debut), lte: new Date(filters.fin) } } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.journalAudit.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: params.skip,
      take: params.pageSize,
      include: { utilisateur: { select: { id: true, nom: true, prenom: true } } },
    }),
    prisma.journalAudit.count({ where }),
  ]);

  return toPaginatedResult(items, total, params);
}

export async function listActionsDistinctes(): Promise<string[]> {
  const rows = await prisma.journalAudit.findMany({ distinct: ['action'], select: { action: true }, orderBy: { action: 'asc' } });
  return rows.map((r) => r.action);
}
