import type { Request, Response } from 'express';
import { logAudit } from '../../lib/audit';
import { parsePagination } from '../../lib/pagination';
import * as commandesService from '../commandes/service';
import { changeStatutSchema, devisContentSchema } from './schema';
import * as devisService from './service';

export async function listDevisHandler(req: Request, res: Response): Promise<void> {
  const params = parsePagination(req);
  const statut = typeof req.query.statut === 'string' ? req.query.statut : undefined;
  const clientId = typeof req.query.clientId === 'string' ? req.query.clientId : undefined;
  const chantierId = typeof req.query.chantierId === 'string' ? req.query.chantierId : undefined;
  res.json(await devisService.listDevis(params, { statut, clientId, chantierId }));
}

export async function getDevisHandler(req: Request, res: Response): Promise<void> {
  res.json(await devisService.getDevis(req.params.id as string));
}

export async function createDevisHandler(req: Request, res: Response): Promise<void> {
  const data = devisContentSchema.parse(req.body);
  const devis = await devisService.createDevis(data);
  await logAudit({ utilisateurId: req.user?.id, action: 'CREATE_DEVIS', entite: 'Devis', entiteId: devis.id });
  res.status(201).json(devis);
}

export async function updateDevisHandler(req: Request, res: Response): Promise<void> {
  const data = devisContentSchema.parse(req.body);
  const devis = await devisService.updateDevis(req.params.id as string, data);
  await logAudit({ utilisateurId: req.user?.id, action: 'UPDATE_DEVIS', entite: 'Devis', entiteId: devis.id });
  res.json(devis);
}

export async function deleteDevisHandler(req: Request, res: Response): Promise<void> {
  await devisService.deleteDevis(req.params.id as string);
  await logAudit({ utilisateurId: req.user?.id, action: 'DELETE_DEVIS', entite: 'Devis', entiteId: req.params.id });
  res.status(204).end();
}

export async function changeStatutDevisHandler(req: Request, res: Response): Promise<void> {
  const { statut } = changeStatutSchema.parse(req.body);
  const devis = await devisService.changeStatutDevis(req.params.id as string, statut);
  await logAudit({
    utilisateurId: req.user?.id,
    action: 'CHANGE_STATUT_DEVIS',
    entite: 'Devis',
    entiteId: devis.id,
    metadonnees: { statut },
  });
  res.json(devis);
}

export async function convertirEnCommandeHandler(req: Request, res: Response): Promise<void> {
  const commandeId = await devisService.convertirEnCommande(req.params.id as string);
  await logAudit({
    utilisateurId: req.user?.id,
    action: 'CONVERTIR_DEVIS_COMMANDE',
    entite: 'Devis',
    entiteId: req.params.id,
    metadonnees: { commandeId },
  });
  res.status(201).json(await commandesService.getCommande(commandeId));
}
