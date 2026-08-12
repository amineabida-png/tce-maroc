import type { Request, Response } from 'express';
import { logAudit } from '../../lib/audit';
import { parsePagination } from '../../lib/pagination';
import { AppError } from '../../middleware/errorHandler';
import { upsertPointageSchema } from './schema';
import * as service from './service';

export async function listPointagesHandler(req: Request, res: Response): Promise<void> {
  const params = parsePagination(req);
  const employeId = typeof req.query.employeId === 'string' ? req.query.employeId : undefined;
  const chantierId = typeof req.query.chantierId === 'string' ? req.query.chantierId : undefined;
  const statut = typeof req.query.statut === 'string' ? req.query.statut : undefined;
  const debut = typeof req.query.debut === 'string' ? req.query.debut : undefined;
  const fin = typeof req.query.fin === 'string' ? req.query.fin : undefined;
  res.json(await service.listPointages(params, { employeId, chantierId, statut, debut, fin }));
}

export async function upsertPointageHandler(req: Request, res: Response): Promise<void> {
  const data = upsertPointageSchema.parse(req.body);
  const pointage = await service.upsertPointage(data);
  await logAudit({
    utilisateurId: req.user?.id,
    action: 'UPSERT_POINTAGE',
    entite: 'Pointage',
    entiteId: pointage.id,
    metadonnees: { employeId: data.employeId, date: data.date, statut: data.statut },
  });
  res.status(200).json(pointage);
}

export async function deletePointageHandler(req: Request, res: Response): Promise<void> {
  await service.deletePointage(req.params.id as string);
  await logAudit({ utilisateurId: req.user?.id, action: 'DELETE_POINTAGE', entite: 'Pointage', entiteId: req.params.id });
  res.status(204).end();
}

export async function coutMainDoeuvreHandler(req: Request, res: Response): Promise<void> {
  const chantierId = typeof req.query.chantierId === 'string' ? req.query.chantierId : '';
  if (!chantierId) throw new AppError(400, 'Le paramètre chantierId est obligatoire.');
  const debut = typeof req.query.debut === 'string' ? req.query.debut : undefined;
  const fin = typeof req.query.fin === 'string' ? req.query.fin : undefined;
  res.json(await service.getCoutMainDoeuvre(chantierId, debut, fin));
}
