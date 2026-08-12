import type { Request, Response } from 'express';
import { logAudit } from '../../lib/audit';
import { parsePagination } from '../../lib/pagination';
import { createCompteSchema, updateCompteSchema } from './schema';
import * as service from './service';

export async function listComptesHandler(req: Request, res: Response): Promise<void> {
  const params = parsePagination(req);
  const includeInactifs = req.query.includeInactifs === 'true';
  res.json(await service.listComptes(params, { includeInactifs }));
}

export async function getCompteHandler(req: Request, res: Response): Promise<void> {
  res.json(await service.getCompte(req.params.id as string));
}

export async function createCompteHandler(req: Request, res: Response): Promise<void> {
  const data = createCompteSchema.parse(req.body);
  const compte = await service.createCompte(data);
  await logAudit({ utilisateurId: req.user?.id, action: 'CREATE_COMPTE_TRESORERIE', entite: 'CompteTresorerie', entiteId: compte.id });
  res.status(201).json(compte);
}

export async function updateCompteHandler(req: Request, res: Response): Promise<void> {
  const data = updateCompteSchema.parse(req.body);
  const compte = await service.updateCompte(req.params.id as string, data);
  await logAudit({ utilisateurId: req.user?.id, action: 'UPDATE_COMPTE_TRESORERIE', entite: 'CompteTresorerie', entiteId: compte.id });
  res.json(compte);
}

export async function deactivateCompteHandler(req: Request, res: Response): Promise<void> {
  const compte = await service.deactivateCompte(req.params.id as string);
  await logAudit({ utilisateurId: req.user?.id, action: 'DEACTIVATE_COMPTE_TRESORERIE', entite: 'CompteTresorerie', entiteId: compte.id });
  res.json(compte);
}

export async function reactivateCompteHandler(req: Request, res: Response): Promise<void> {
  const compte = await service.reactivateCompte(req.params.id as string);
  await logAudit({ utilisateurId: req.user?.id, action: 'REACTIVATE_COMPTE_TRESORERIE', entite: 'CompteTresorerie', entiteId: compte.id });
  res.json(compte);
}
