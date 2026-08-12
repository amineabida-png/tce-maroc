import type { Request, Response } from 'express';
import { logAudit } from '../../lib/audit';
import { parsePagination } from '../../lib/pagination';
import { createMouvementSchema, rapprocherSchema, updateMouvementSchema } from './schema';
import * as service from './service';

function strParam(v: unknown): string | undefined {
  return typeof v === 'string' ? v : undefined;
}

export async function listMouvementsHandler(req: Request, res: Response): Promise<void> {
  const params = parsePagination(req);
  res.json(
    await service.listMouvements(params, {
      compteId: strParam(req.query.compteId),
      sens: strParam(req.query.sens),
      statut: strParam(req.query.statut),
      chantierId: strParam(req.query.chantierId),
      debut: strParam(req.query.debut),
      fin: strParam(req.query.fin),
    })
  );
}

export async function getMouvementHandler(req: Request, res: Response): Promise<void> {
  res.json(await service.getMouvement(req.params.id as string));
}

export async function createMouvementHandler(req: Request, res: Response): Promise<void> {
  const data = createMouvementSchema.parse(req.body);
  const mouvement = await service.createMouvement(data);
  await logAudit({ utilisateurId: req.user?.id, action: 'CREATE_MOUVEMENT_TRESORERIE', entite: 'MouvementTresorerie', entiteId: mouvement.id });
  res.status(201).json(mouvement);
}

export async function updateMouvementHandler(req: Request, res: Response): Promise<void> {
  const data = updateMouvementSchema.parse(req.body);
  const mouvement = await service.updateMouvement(req.params.id as string, data);
  await logAudit({ utilisateurId: req.user?.id, action: 'UPDATE_MOUVEMENT_TRESORERIE', entite: 'MouvementTresorerie', entiteId: mouvement.id });
  res.json(mouvement);
}

export async function deleteMouvementHandler(req: Request, res: Response): Promise<void> {
  await service.deleteMouvement(req.params.id as string);
  await logAudit({ utilisateurId: req.user?.id, action: 'DELETE_MOUVEMENT_TRESORERIE', entite: 'MouvementTresorerie', entiteId: req.params.id });
  res.status(204).end();
}

export async function rapprocherMouvementHandler(req: Request, res: Response): Promise<void> {
  const data = rapprocherSchema.parse(req.body);
  const mouvement = await service.rapprocherMouvement(req.params.id as string, data.rapproche);
  await logAudit({
    utilisateurId: req.user?.id,
    action: 'RAPPROCHER_MOUVEMENT_TRESORERIE',
    entite: 'MouvementTresorerie',
    entiteId: mouvement.id,
    metadonnees: { rapproche: data.rapproche },
  });
  res.json(mouvement);
}

export async function getJournalHandler(req: Request, res: Response): Promise<void> {
  res.json(
    await service.getJournal({
      compteId: strParam(req.query.compteId),
      debut: strParam(req.query.debut),
      fin: strParam(req.query.fin),
    })
  );
}

export async function getEcheancierHandler(req: Request, res: Response): Promise<void> {
  res.json(await service.getEcheancier());
}
