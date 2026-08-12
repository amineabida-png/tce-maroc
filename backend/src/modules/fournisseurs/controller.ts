import type { Request, Response } from 'express';
import { logAudit } from '../../lib/audit';
import { parsePagination } from '../../lib/pagination';
import { createFournisseurSchema, updateFournisseurSchema } from './schema';
import * as fournisseursService from './service';

export async function listFournisseursHandler(req: Request, res: Response): Promise<void> {
  const params = parsePagination(req);
  const includeInactifs = req.query.includeInactifs === 'true';
  res.json(await fournisseursService.listFournisseurs(params, includeInactifs));
}

export async function getFournisseurHandler(req: Request, res: Response): Promise<void> {
  res.json(await fournisseursService.getFournisseur(req.params.id as string));
}

export async function createFournisseurHandler(req: Request, res: Response): Promise<void> {
  const data = createFournisseurSchema.parse(req.body);
  const fournisseur = await fournisseursService.createFournisseur(data);
  await logAudit({
    utilisateurId: req.user?.id,
    action: 'CREATE_FOURNISSEUR',
    entite: 'Fournisseur',
    entiteId: fournisseur.id,
  });
  res.status(201).json(fournisseur);
}

export async function updateFournisseurHandler(req: Request, res: Response): Promise<void> {
  const data = updateFournisseurSchema.parse(req.body);
  const fournisseur = await fournisseursService.updateFournisseur(req.params.id as string, data);
  await logAudit({
    utilisateurId: req.user?.id,
    action: 'UPDATE_FOURNISSEUR',
    entite: 'Fournisseur',
    entiteId: fournisseur.id,
  });
  res.json(fournisseur);
}

export async function deactivateFournisseurHandler(req: Request, res: Response): Promise<void> {
  const fournisseur = await fournisseursService.deactivateFournisseur(req.params.id as string);
  await logAudit({
    utilisateurId: req.user?.id,
    action: 'DEACTIVATE_FOURNISSEUR',
    entite: 'Fournisseur',
    entiteId: fournisseur.id,
  });
  res.json(fournisseur);
}

export async function reactivateFournisseurHandler(req: Request, res: Response): Promise<void> {
  const fournisseur = await fournisseursService.reactivateFournisseur(req.params.id as string);
  await logAudit({
    utilisateurId: req.user?.id,
    action: 'REACTIVATE_FOURNISSEUR',
    entite: 'Fournisseur',
    entiteId: fournisseur.id,
  });
  res.json(fournisseur);
}
