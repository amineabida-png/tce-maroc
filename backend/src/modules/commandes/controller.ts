import type { Request, Response } from 'express';
import { logAudit } from '../../lib/audit';
import { parsePagination } from '../../lib/pagination';
import * as facturesService from '../factures/service';
import { changeStatutCommandeSchema, commandeContentSchema } from './schema';
import * as commandesService from './service';

export async function listCommandesHandler(req: Request, res: Response): Promise<void> {
  const params = parsePagination(req);
  const statut = typeof req.query.statut === 'string' ? req.query.statut : undefined;
  const clientId = typeof req.query.clientId === 'string' ? req.query.clientId : undefined;
  const chantierId = typeof req.query.chantierId === 'string' ? req.query.chantierId : undefined;
  res.json(await commandesService.listCommandes(params, { statut, clientId, chantierId }));
}

export async function getCommandeHandler(req: Request, res: Response): Promise<void> {
  res.json(await commandesService.getCommande(req.params.id as string));
}

export async function createCommandeHandler(req: Request, res: Response): Promise<void> {
  const data = commandeContentSchema.parse(req.body);
  const commande = await commandesService.createCommande(data);
  await logAudit({ utilisateurId: req.user?.id, action: 'CREATE_COMMANDE', entite: 'Commande', entiteId: commande.id });
  res.status(201).json(commande);
}

export async function updateCommandeHandler(req: Request, res: Response): Promise<void> {
  const data = commandeContentSchema.parse(req.body);
  const commande = await commandesService.updateCommande(req.params.id as string, data, req.user?.role);
  await logAudit({ utilisateurId: req.user?.id, action: 'UPDATE_COMMANDE', entite: 'Commande', entiteId: commande.id });
  res.json(commande);
}

export async function deleteCommandeHandler(req: Request, res: Response): Promise<void> {
  await commandesService.deleteCommande(req.params.id as string, req.user?.role);
  await logAudit({ utilisateurId: req.user?.id, action: 'DELETE_COMMANDE', entite: 'Commande', entiteId: req.params.id });
  res.status(204).end();
}

export async function changeStatutCommandeHandler(req: Request, res: Response): Promise<void> {
  const { statut } = changeStatutCommandeSchema.parse(req.body);
  const commande = await commandesService.changeStatutCommande(req.params.id as string, statut);
  await logAudit({
    utilisateurId: req.user?.id,
    action: 'CHANGE_STATUT_COMMANDE',
    entite: 'Commande',
    entiteId: commande.id,
    metadonnees: { statut },
  });
  res.json(commande);
}

export async function convertirEnFactureHandler(req: Request, res: Response): Promise<void> {
  const factureId = await commandesService.convertirEnFacture(req.params.id as string);
  await logAudit({
    utilisateurId: req.user?.id,
    action: 'CONVERTIR_COMMANDE_FACTURE',
    entite: 'Commande',
    entiteId: req.params.id,
    metadonnees: { factureId },
  });
  res.status(201).json(await facturesService.getFacture(factureId));
}
