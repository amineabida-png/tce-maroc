import type { Request, Response } from 'express';
import { logAudit } from '../../lib/audit';
import { AppError } from '../../middleware/errorHandler';
import { parsePagination } from '../../lib/pagination';
import { changeStatutSchema, situationContentSchema } from './schema';
import * as service from './service';

export async function listHandler(req: Request, res: Response): Promise<void> {
  const params = parsePagination(req);
  const commandeId = typeof req.query.commandeId === 'string' ? req.query.commandeId : undefined;
  const contratSousTraitantId = typeof req.query.contratSousTraitantId === 'string' ? req.query.contratSousTraitantId : undefined;
  const chantierId = typeof req.query.chantierId === 'string' ? req.query.chantierId : undefined;
  const statut = typeof req.query.statut === 'string' ? req.query.statut : undefined;
  res.json(await service.listSituations(params, { commandeId, contratSousTraitantId, chantierId, statut }));
}

export async function getResumeHandler(_req: Request, res: Response): Promise<void> {
  res.json(await service.getResume());
}

export async function getEtatMarcheHandler(req: Request, res: Response): Promise<void> {
  const commandeId = typeof req.query.commandeId === 'string' ? req.query.commandeId : undefined;
  const contratSousTraitantId = typeof req.query.contratSousTraitantId === 'string' ? req.query.contratSousTraitantId : undefined;
  if (Boolean(commandeId) === Boolean(contratSousTraitantId)) {
    throw new AppError(400, 'Précisez exactement un marché (commandeId ou contratSousTraitantId).');
  }
  const [field, id] = commandeId ? (['commandeId', commandeId] as const) : (['contratSousTraitantId', contratSousTraitantId as string] as const);
  res.json(await service.getEtatMarche(field, id));
}

export async function getHandler(req: Request, res: Response): Promise<void> {
  res.json(await service.getSituation(req.params.id as string));
}

export async function createHandler(req: Request, res: Response): Promise<void> {
  const data = situationContentSchema.parse(req.body);
  const situation = await service.createSituation(data);
  await logAudit({ utilisateurId: req.user?.id, action: 'CREATE_SITUATION', entite: 'Situation', entiteId: situation.id });
  res.status(201).json(situation);
}

export async function updateHandler(req: Request, res: Response): Promise<void> {
  const data = situationContentSchema.parse(req.body);
  const situation = await service.updateSituation(req.params.id as string, data);
  await logAudit({ utilisateurId: req.user?.id, action: 'UPDATE_SITUATION', entite: 'Situation', entiteId: situation.id });
  res.json(situation);
}

export async function deleteHandler(req: Request, res: Response): Promise<void> {
  await service.deleteSituation(req.params.id as string);
  await logAudit({ utilisateurId: req.user?.id, action: 'DELETE_SITUATION', entite: 'Situation', entiteId: req.params.id });
  res.status(204).end();
}

export async function changeStatutHandler(req: Request, res: Response): Promise<void> {
  const { statut } = changeStatutSchema.parse(req.body);
  const situation = await service.changeStatutSituation(req.params.id as string, statut);
  await logAudit({ utilisateurId: req.user?.id, action: 'CHANGE_STATUT_SITUATION', entite: 'Situation', entiteId: situation.id, metadonnees: { statut } });
  res.json(situation);
}
