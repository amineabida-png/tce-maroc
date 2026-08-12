import type { Request, Response } from 'express';
import { logAudit } from '../../lib/audit';
import { parsePagination } from '../../lib/pagination';
import {
  createChantierSchema,
  createDepenseSchema,
  createTacheSchema,
  updateChantierSchema,
  updateTacheSchema,
} from './schema';
import * as chantiersService from './service';

/* ============================ CHANTIERS ============================ */

export async function listChantiersHandler(req: Request, res: Response): Promise<void> {
  const params = parsePagination(req);
  const includeInactifs = req.query.includeInactifs === 'true';
  const statut = typeof req.query.statut === 'string' ? req.query.statut : undefined;
  res.json(await chantiersService.listChantiers(params, { statut, includeInactifs }));
}

export async function getChantierHandler(req: Request, res: Response): Promise<void> {
  res.json(await chantiersService.getChantier(req.params.id as string));
}

export async function createChantierHandler(req: Request, res: Response): Promise<void> {
  const data = createChantierSchema.parse(req.body);
  const chantier = await chantiersService.createChantier(data);
  await logAudit({ utilisateurId: req.user?.id, action: 'CREATE_CHANTIER', entite: 'Chantier', entiteId: chantier.id });
  res.status(201).json(chantier);
}

export async function updateChantierHandler(req: Request, res: Response): Promise<void> {
  const data = updateChantierSchema.parse(req.body);
  const chantier = await chantiersService.updateChantier(req.params.id as string, data);
  await logAudit({ utilisateurId: req.user?.id, action: 'UPDATE_CHANTIER', entite: 'Chantier', entiteId: chantier.id });
  res.json(chantier);
}

export async function deactivateChantierHandler(req: Request, res: Response): Promise<void> {
  const chantier = await chantiersService.deactivateChantier(req.params.id as string);
  await logAudit({ utilisateurId: req.user?.id, action: 'DEACTIVATE_CHANTIER', entite: 'Chantier', entiteId: chantier.id });
  res.json(chantier);
}

export async function reactivateChantierHandler(req: Request, res: Response): Promise<void> {
  const chantier = await chantiersService.reactivateChantier(req.params.id as string);
  await logAudit({ utilisateurId: req.user?.id, action: 'REACTIVATE_CHANTIER', entite: 'Chantier', entiteId: chantier.id });
  res.json(chantier);
}

export async function getBudgetSummaryHandler(req: Request, res: Response): Promise<void> {
  res.json(await chantiersService.getBudgetSummary(req.params.id as string));
}

/* ============================ TÂCHES ============================ */

export async function listTachesHandler(req: Request, res: Response): Promise<void> {
  res.json(await chantiersService.listTaches(req.params.id as string));
}

export async function createTacheHandler(req: Request, res: Response): Promise<void> {
  const data = createTacheSchema.parse(req.body);
  const tache = await chantiersService.createTache(req.params.id as string, data);
  await logAudit({ utilisateurId: req.user?.id, action: 'CREATE_TACHE', entite: 'TacheChantier', entiteId: tache.id });
  res.status(201).json(tache);
}

export async function updateTacheHandler(req: Request, res: Response): Promise<void> {
  const data = updateTacheSchema.parse(req.body);
  const tache = await chantiersService.updateTache(req.params.id as string, req.params.tacheId as string, data);
  await logAudit({ utilisateurId: req.user?.id, action: 'UPDATE_TACHE', entite: 'TacheChantier', entiteId: tache.id });
  res.json(tache);
}

export async function deleteTacheHandler(req: Request, res: Response): Promise<void> {
  await chantiersService.deleteTache(req.params.id as string, req.params.tacheId as string);
  await logAudit({ utilisateurId: req.user?.id, action: 'DELETE_TACHE', entite: 'TacheChantier', entiteId: req.params.tacheId });
  res.status(204).end();
}

/* ============================ DÉPENSES ============================ */

export async function listDepensesHandler(req: Request, res: Response): Promise<void> {
  res.json(await chantiersService.listDepenses(req.params.id as string));
}

export async function createDepenseHandler(req: Request, res: Response): Promise<void> {
  const data = createDepenseSchema.parse(req.body);
  const depense = await chantiersService.createDepense(req.params.id as string, data);
  await logAudit({
    utilisateurId: req.user?.id,
    action: 'CREATE_DEPENSE',
    entite: 'DepenseChantier',
    entiteId: depense.id,
    metadonnees: { chantierId: req.params.id, montant: data.montant, categorie: data.categorie },
  });
  res.status(201).json(depense);
}

export async function deleteDepenseHandler(req: Request, res: Response): Promise<void> {
  await chantiersService.deleteDepense(req.params.id as string, req.params.depenseId as string);
  await logAudit({
    utilisateurId: req.user?.id,
    action: 'DELETE_DEPENSE',
    entite: 'DepenseChantier',
    entiteId: req.params.depenseId,
  });
  res.status(204).end();
}
