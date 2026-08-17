import type { Request, Response } from 'express';
import { logAudit } from '../../lib/audit';
import { parsePagination } from '../../lib/pagination';
import { changeStatutSchema, commandeFournisseurContentSchema, receptionSchema } from './schema';
import * as service from './service';

export async function listHandler(req: Request, res: Response): Promise<void> {
  const params = parsePagination(req);
  const statut = typeof req.query.statut === 'string' ? req.query.statut : undefined;
  const fournisseurId = typeof req.query.fournisseurId === 'string' ? req.query.fournisseurId : undefined;
  const chantierId = typeof req.query.chantierId === 'string' ? req.query.chantierId : undefined;
  res.json(await service.listCommandesFournisseur(params, { statut, fournisseurId, chantierId }));
}

export async function getResumeHandler(_req: Request, res: Response): Promise<void> {
  res.json(await service.getResume());
}

export async function getHandler(req: Request, res: Response): Promise<void> {
  res.json(await service.getCommandeFournisseur(req.params.id as string));
}

export async function createHandler(req: Request, res: Response): Promise<void> {
  const data = commandeFournisseurContentSchema.parse(req.body);
  const cf = await service.createCommandeFournisseur(data);
  await logAudit({ utilisateurId: req.user?.id, action: 'CREATE_COMMANDE_FOURNISSEUR', entite: 'CommandeFournisseur', entiteId: cf.id });
  res.status(201).json(cf);
}

export async function updateHandler(req: Request, res: Response): Promise<void> {
  const data = commandeFournisseurContentSchema.parse(req.body);
  const cf = await service.updateCommandeFournisseur(req.params.id as string, data, req.user?.role);
  await logAudit({ utilisateurId: req.user?.id, action: 'UPDATE_COMMANDE_FOURNISSEUR', entite: 'CommandeFournisseur', entiteId: cf.id });
  res.json(cf);
}

export async function deleteHandler(req: Request, res: Response): Promise<void> {
  await service.deleteCommandeFournisseur(req.params.id as string, req.user?.role);
  await logAudit({ utilisateurId: req.user?.id, action: 'DELETE_COMMANDE_FOURNISSEUR', entite: 'CommandeFournisseur', entiteId: req.params.id });
  res.status(204).end();
}

export async function changeStatutHandler(req: Request, res: Response): Promise<void> {
  const { statut } = changeStatutSchema.parse(req.body);
  const cf = await service.changeStatutCommandeFournisseur(req.params.id as string, statut);
  await logAudit({
    utilisateurId: req.user?.id,
    action: 'CHANGE_STATUT_COMMANDE_FOURNISSEUR',
    entite: 'CommandeFournisseur',
    entiteId: cf.id,
    metadonnees: { statut },
  });
  res.json(cf);
}

export async function receptionHandler(req: Request, res: Response): Promise<void> {
  const data = receptionSchema.parse(req.body);
  const cf = await service.receptionner(req.params.id as string, data);
  await logAudit({
    utilisateurId: req.user?.id,
    action: 'RECEPTION_COMMANDE_FOURNISSEUR',
    entite: 'CommandeFournisseur',
    entiteId: cf.id,
    metadonnees: { lignes: data.lignes },
  });
  res.json(cf);
}
