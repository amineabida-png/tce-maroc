import type { Request, Response } from 'express';
import { logAudit } from '../../lib/audit';
import { parsePagination } from '../../lib/pagination';
import { changeStatutSchema, contratSousTraitantContentSchema } from './schema';
import * as service from './service';

export async function listHandler(req: Request, res: Response): Promise<void> {
  const params = parsePagination(req);
  const statut = typeof req.query.statut === 'string' ? req.query.statut : undefined;
  const sousTraitantId = typeof req.query.sousTraitantId === 'string' ? req.query.sousTraitantId : undefined;
  const chantierId = typeof req.query.chantierId === 'string' ? req.query.chantierId : undefined;
  res.json(await service.listContratsSousTraitance(params, { statut, sousTraitantId, chantierId }));
}

export async function getResumeHandler(_req: Request, res: Response): Promise<void> {
  res.json(await service.getResume());
}

export async function getHandler(req: Request, res: Response): Promise<void> {
  res.json(await service.getContratSousTraitant(req.params.id as string));
}

export async function createHandler(req: Request, res: Response): Promise<void> {
  const data = contratSousTraitantContentSchema.parse(req.body);
  const contrat = await service.createContratSousTraitant(data);
  await logAudit({ utilisateurId: req.user?.id, action: 'CREATE_CONTRAT_SOUS_TRAITANCE', entite: 'ContratSousTraitant', entiteId: contrat.id });
  res.status(201).json(contrat);
}

export async function updateHandler(req: Request, res: Response): Promise<void> {
  const data = contratSousTraitantContentSchema.parse(req.body);
  const contrat = await service.updateContratSousTraitant(req.params.id as string, data, req.user?.role);
  await logAudit({ utilisateurId: req.user?.id, action: 'UPDATE_CONTRAT_SOUS_TRAITANCE', entite: 'ContratSousTraitant', entiteId: contrat.id });
  res.json(contrat);
}

export async function deleteHandler(req: Request, res: Response): Promise<void> {
  await service.deleteContratSousTraitant(req.params.id as string, req.user?.role);
  await logAudit({ utilisateurId: req.user?.id, action: 'DELETE_CONTRAT_SOUS_TRAITANCE', entite: 'ContratSousTraitant', entiteId: req.params.id });
  res.status(204).end();
}

export async function changeStatutHandler(req: Request, res: Response): Promise<void> {
  const { statut } = changeStatutSchema.parse(req.body);
  const contrat = await service.changeStatutContratSousTraitant(req.params.id as string, statut);
  await logAudit({
    utilisateurId: req.user?.id,
    action: 'CHANGE_STATUT_CONTRAT_SOUS_TRAITANCE',
    entite: 'ContratSousTraitant',
    entiteId: contrat.id,
    metadonnees: { statut },
  });
  res.json(contrat);
}
