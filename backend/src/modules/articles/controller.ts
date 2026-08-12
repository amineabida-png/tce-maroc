import type { Request, Response } from 'express';
import { logAudit } from '../../lib/audit';
import { parsePagination } from '../../lib/pagination';
import { createArticleSchema, updateArticleSchema } from './schema';
import * as articlesService from './service';

export async function listArticlesHandler(req: Request, res: Response): Promise<void> {
  const params = parsePagination(req);
  const includeInactifs = req.query.includeInactifs === 'true';
  const sousSeuilUniquement = req.query.sousSeuil === 'true';
  res.json(await articlesService.listArticles(params, { includeInactifs, sousSeuilUniquement }));
}

export async function getArticleHandler(req: Request, res: Response): Promise<void> {
  res.json(await articlesService.getArticle(req.params.id as string));
}

export async function createArticleHandler(req: Request, res: Response): Promise<void> {
  const data = createArticleSchema.parse(req.body);
  const article = await articlesService.createArticle(data);
  await logAudit({ utilisateurId: req.user?.id, action: 'CREATE_ARTICLE', entite: 'Article', entiteId: article.id });
  res.status(201).json(article);
}

export async function updateArticleHandler(req: Request, res: Response): Promise<void> {
  const data = updateArticleSchema.parse(req.body);
  const article = await articlesService.updateArticle(req.params.id as string, data);
  await logAudit({ utilisateurId: req.user?.id, action: 'UPDATE_ARTICLE', entite: 'Article', entiteId: article.id });
  res.json(article);
}

export async function deactivateArticleHandler(req: Request, res: Response): Promise<void> {
  const article = await articlesService.deactivateArticle(req.params.id as string);
  await logAudit({ utilisateurId: req.user?.id, action: 'DEACTIVATE_ARTICLE', entite: 'Article', entiteId: article.id });
  res.json(article);
}

export async function reactivateArticleHandler(req: Request, res: Response): Promise<void> {
  const article = await articlesService.reactivateArticle(req.params.id as string);
  await logAudit({ utilisateurId: req.user?.id, action: 'REACTIVATE_ARTICLE', entite: 'Article', entiteId: article.id });
  res.json(article);
}
