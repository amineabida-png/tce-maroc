import type { Request, Response } from 'express';
import { logAudit } from '../../lib/audit';
import { parsePagination } from '../../lib/pagination';
import { createSortieSchema } from './schema';
import * as service from './service';

export async function listMouvementsHandler(req: Request, res: Response): Promise<void> {
  const params = parsePagination(req);
  const articleId = typeof req.query.articleId === 'string' ? req.query.articleId : undefined;
  const chantierId = typeof req.query.chantierId === 'string' ? req.query.chantierId : undefined;
  const type = typeof req.query.type === 'string' ? req.query.type : undefined;
  res.json(await service.listMouvements(params, { articleId, chantierId, type }));
}

export async function createSortieHandler(req: Request, res: Response): Promise<void> {
  const data = createSortieSchema.parse(req.body);
  const mouvement = await service.createSortie(data);
  await logAudit({
    utilisateurId: req.user?.id,
    action: 'CREATE_SORTIE_STOCK',
    entite: 'MouvementStock',
    entiteId: mouvement.id,
    metadonnees: { articleId: data.articleId, quantite: data.quantite, chantierId: data.chantierId },
  });
  res.status(201).json(mouvement);
}
