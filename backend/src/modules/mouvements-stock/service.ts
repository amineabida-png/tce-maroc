import { Prisma, type TypeMouvementStock } from '@prisma/client';
import { prisma } from '../../db/client';
import { AppError } from '../../middleware/errorHandler';
import { computeStockSummary } from '../../lib/stock';
import { type PaginationParams, toPaginatedResult } from '../../lib/pagination';
import type { CreateSortieInput } from './schema';

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

export async function listMouvements(
  params: PaginationParams,
  filters: { articleId?: string; chantierId?: string; type?: string }
) {
  const where: Prisma.MouvementStockWhereInput = {
    ...(filters.articleId ? { articleId: filters.articleId } : {}),
    ...(filters.chantierId ? { chantierId: filters.chantierId } : {}),
    ...(filters.type ? { type: filters.type as TypeMouvementStock } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.mouvementStock.findMany({
      where,
      orderBy: { date: 'desc' },
      skip: params.skip,
      take: params.pageSize,
      include: {
        article: { select: { id: true, nom: true, unite: true } },
        chantier: { select: { id: true, nom: true } },
      },
    }),
    prisma.mouvementStock.count({ where }),
  ]);

  return toPaginatedResult(items, total, params);
}

// Empêche une sortie de rendre le stock négatif — vérifié contre le niveau
// réel (recalculé depuis le grand livre), pas contre un compteur qui
// pourrait être désynchronisé.
export async function createSortie(data: CreateSortieInput) {
  const article = await prisma.article.findUnique({ where: { id: data.articleId } });
  if (!article) throw new AppError(404, 'Article introuvable.');

  const mouvementsExistants = await prisma.mouvementStock.findMany({
    where: { articleId: data.articleId },
    select: { type: true, quantite: true, prixUnitaire: true },
  });
  const stock = computeStockSummary(mouvementsExistants);
  if (data.quantite > stock.quantiteEnStock + 1e-6) {
    throw new AppError(
      400,
      `Stock insuffisant pour « ${article.nom} » : ${stock.quantiteEnStock} ${article.unite} disponible(s), ${data.quantite} demandé(s).`
    );
  }

  return prisma.mouvementStock.create({
    data: {
      articleId: data.articleId,
      type: 'SORTIE',
      quantite: data.quantite,
      chantierId: normalizeEmptyToNull(data.chantierId) ?? null,
      date: normalizeDate(data.date) ?? new Date(),
      notes: data.notes,
    },
    include: {
      article: { select: { id: true, nom: true, unite: true } },
      chantier: { select: { id: true, nom: true } },
    },
  });
}
