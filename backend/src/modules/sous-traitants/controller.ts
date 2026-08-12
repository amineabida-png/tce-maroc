import type { Request, Response } from 'express';
import { logAudit } from '../../lib/audit';
import { parsePagination } from '../../lib/pagination';
import { createSousTraitantSchema, updateSousTraitantSchema } from './schema';
import * as sousTraitantsService from './service';

export async function listSousTraitantsHandler(req: Request, res: Response): Promise<void> {
  const params = parsePagination(req);
  const includeInactifs = req.query.includeInactifs === 'true';
  res.json(await sousTraitantsService.listSousTraitants(params, includeInactifs));
}

export async function getSousTraitantHandler(req: Request, res: Response): Promise<void> {
  res.json(await sousTraitantsService.getSousTraitant(req.params.id as string));
}

export async function createSousTraitantHandler(req: Request, res: Response): Promise<void> {
  const data = createSousTraitantSchema.parse(req.body);
  const sousTraitant = await sousTraitantsService.createSousTraitant(data);
  await logAudit({
    utilisateurId: req.user?.id,
    action: 'CREATE_SOUS_TRAITANT',
    entite: 'SousTraitant',
    entiteId: sousTraitant.id,
  });
  res.status(201).json(sousTraitant);
}

export async function updateSousTraitantHandler(req: Request, res: Response): Promise<void> {
  const data = updateSousTraitantSchema.parse(req.body);
  const sousTraitant = await sousTraitantsService.updateSousTraitant(req.params.id as string, data);
  await logAudit({
    utilisateurId: req.user?.id,
    action: 'UPDATE_SOUS_TRAITANT',
    entite: 'SousTraitant',
    entiteId: sousTraitant.id,
  });
  res.json(sousTraitant);
}

export async function deactivateSousTraitantHandler(req: Request, res: Response): Promise<void> {
  const sousTraitant = await sousTraitantsService.deactivateSousTraitant(req.params.id as string);
  await logAudit({
    utilisateurId: req.user?.id,
    action: 'DEACTIVATE_SOUS_TRAITANT',
    entite: 'SousTraitant',
    entiteId: sousTraitant.id,
  });
  res.json(sousTraitant);
}

export async function reactivateSousTraitantHandler(req: Request, res: Response): Promise<void> {
  const sousTraitant = await sousTraitantsService.reactivateSousTraitant(req.params.id as string);
  await logAudit({
    utilisateurId: req.user?.id,
    action: 'REACTIVATE_SOUS_TRAITANT',
    entite: 'SousTraitant',
    entiteId: sousTraitant.id,
  });
  res.json(sousTraitant);
}
