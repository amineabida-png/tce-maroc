import { Prisma } from '@prisma/client';
import { prisma } from '../../db/client';
import { AppError } from '../../middleware/errorHandler';
import { computeStockSummary } from '../../lib/stock';
import { type PaginationParams, toPaginatedResult } from '../../lib/pagination';
import type { CreateArticleInput, UpdateArticleInput } from './schema';

async function withStock<T extends { id: string; seuilAlerte: Prisma.Decimal | null }>(article: T) {
  const mouvements = await prisma.mouvementStock.findMany({
    where: { articleId: article.id },
    select: { type: true, quantite: true, prixUnitaire: true },
  });
  return { ...article, stock: computeStockSummary(mouvements, article.seuilAlerte) };
}

export async function listArticles(
  params: PaginationParams,
  filters: { includeInactifs: boolean; sousSeuilUniquement: boolean }
) {
  const where: Prisma.ArticleWhereInput = {
    ...(filters.includeInactifs ? {} : { actif: true }),
    ...(params.q
      ? { OR: [{ nom: { contains: params.q, mode: 'insensitive' } }, { categorie: { contains: params.q, mode: 'insensitive' } }] }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.article.findMany({ where, orderBy: { nom: 'asc' }, skip: params.skip, take: params.pageSize }),
    prisma.article.count({ where }),
  ]);

  let withSums = await Promise.all(items.map(withStock));
  if (filters.sousSeuilUniquement) withSums = withSums.filter((a) => a.stock.sousLeSeuil);

  return toPaginatedResult(withSums, total, params);
}

async function fetchArticleOrThrow(id: string) {
  const article = await prisma.article.findUnique({ where: { id } });
  if (!article) throw new AppError(404, 'Article introuvable.');
  return article;
}

export async function getArticle(id: string) {
  const article = await fetchArticleOrThrow(id);
  const mouvements = await prisma.mouvementStock.findMany({
    where: { articleId: id },
    orderBy: { date: 'desc' },
    include: { chantier: { select: { id: true, nom: true } } },
  });
  return { ...(await withStock(article)), mouvements };
}

export async function createArticle(data: CreateArticleInput) {
  return prisma.article.create({ data });
}

export async function updateArticle(id: string, data: UpdateArticleInput) {
  await fetchArticleOrThrow(id);
  return prisma.article.update({ where: { id }, data });
}

export async function deactivateArticle(id: string) {
  await fetchArticleOrThrow(id);
  return prisma.article.update({ where: { id }, data: { actif: false } });
}

export async function reactivateArticle(id: string) {
  await fetchArticleOrThrow(id);
  return prisma.article.update({ where: { id }, data: { actif: true } });
}
