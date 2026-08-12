import type { Request, Response } from 'express';
import { logAudit } from '../../lib/audit';
import { parsePagination } from '../../lib/pagination';
import { createOuvrageSchema, updateOuvrageSchema } from './schema';
import * as ouvragesService from './service';

export async function listOuvragesHandler(req: Request, res: Response): Promise<void> {
  const params = parsePagination(req);
  const includeInactifs = req.query.includeInactifs === 'true';
  res.json(await ouvragesService.listOuvrages(params, includeInactifs));
}

export async function getOuvrageHandler(req: Request, res: Response): Promise<void> {
  res.json(await ouvragesService.getOuvrage(req.params.id as string));
}

export async function createOuvrageHandler(req: Request, res: Response): Promise<void> {
  const data = createOuvrageSchema.parse(req.body);
  const ouvrage = await ouvragesService.createOuvrage(data);
  await logAudit({ utilisateurId: req.user?.id, action: 'CREATE_OUVRAGE', entite: 'Ouvrage', entiteId: ouvrage.id });
  res.status(201).json(ouvrage);
}

export async function updateOuvrageHandler(req: Request, res: Response): Promise<void> {
  const data = updateOuvrageSchema.parse(req.body);
  const ouvrage = await ouvragesService.updateOuvrage(req.params.id as string, data);
  await logAudit({ utilisateurId: req.user?.id, action: 'UPDATE_OUVRAGE', entite: 'Ouvrage', entiteId: ouvrage.id });
  res.json(ouvrage);
}

export async function deactivateOuvrageHandler(req: Request, res: Response): Promise<void> {
  const ouvrage = await ouvragesService.deactivateOuvrage(req.params.id as string);
  await logAudit({ utilisateurId: req.user?.id, action: 'DEACTIVATE_OUVRAGE', entite: 'Ouvrage', entiteId: ouvrage.id });
  res.json(ouvrage);
}

export async function reactivateOuvrageHandler(req: Request, res: Response): Promise<void> {
  const ouvrage = await ouvragesService.reactivateOuvrage(req.params.id as string);
  await logAudit({ utilisateurId: req.user?.id, action: 'REACTIVATE_OUVRAGE', entite: 'Ouvrage', entiteId: ouvrage.id });
  res.json(ouvrage);
}
