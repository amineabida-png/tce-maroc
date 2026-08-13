import type { Request, Response } from 'express';
import { logAudit } from '../../lib/audit';
import { parsePagination } from '../../lib/pagination';
import { bonLivraisonContentSchema } from './schema';
import * as service from './service';

export async function listHandler(req: Request, res: Response): Promise<void> {
  const params = parsePagination(req);
  const clientId = typeof req.query.clientId === 'string' ? req.query.clientId : undefined;
  const chantierId = typeof req.query.chantierId === 'string' ? req.query.chantierId : undefined;
  res.json(await service.listBonsLivraison(params, { clientId, chantierId }));
}

export async function getResumeHandler(_req: Request, res: Response): Promise<void> {
  res.json(await service.getResume());
}

export async function getHandler(req: Request, res: Response): Promise<void> {
  res.json(await service.getBonLivraison(req.params.id as string));
}

export async function createHandler(req: Request, res: Response): Promise<void> {
  const data = bonLivraisonContentSchema.parse(req.body);
  const bl = await service.createBonLivraison(data);
  await logAudit({ utilisateurId: req.user?.id, action: 'CREATE_BON_LIVRAISON', entite: 'BonLivraison', entiteId: bl.id });
  res.status(201).json(bl);
}

export async function updateHandler(req: Request, res: Response): Promise<void> {
  const data = bonLivraisonContentSchema.parse(req.body);
  const bl = await service.updateBonLivraison(req.params.id as string, data);
  await logAudit({ utilisateurId: req.user?.id, action: 'UPDATE_BON_LIVRAISON', entite: 'BonLivraison', entiteId: bl.id });
  res.json(bl);
}

export async function deleteHandler(req: Request, res: Response): Promise<void> {
  await service.deleteBonLivraison(req.params.id as string);
  await logAudit({ utilisateurId: req.user?.id, action: 'DELETE_BON_LIVRAISON', entite: 'BonLivraison', entiteId: req.params.id });
  res.status(204).end();
}
