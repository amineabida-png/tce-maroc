import type { Request, Response } from 'express';
import { logAudit } from '../../lib/audit';
import { parsePagination } from '../../lib/pagination';
import { createPaiementSchema, factureContentSchema } from './schema';
import * as facturesService from './service';

export async function listFacturesHandler(req: Request, res: Response): Promise<void> {
  const params = parsePagination(req);
  const statut = typeof req.query.statut === 'string' ? req.query.statut : undefined;
  const clientId = typeof req.query.clientId === 'string' ? req.query.clientId : undefined;
  const chantierId = typeof req.query.chantierId === 'string' ? req.query.chantierId : undefined;
  const impayeesUniquement = req.query.impayees === 'true';
  res.json(await facturesService.listFactures(params, { statut, clientId, chantierId, impayeesUniquement }));
}

export async function getFactureHandler(req: Request, res: Response): Promise<void> {
  res.json(await facturesService.getFacture(req.params.id as string));
}

export async function createFactureHandler(req: Request, res: Response): Promise<void> {
  const data = factureContentSchema.parse(req.body);
  const facture = await facturesService.createFacture(data);
  await logAudit({ utilisateurId: req.user?.id, action: 'CREATE_FACTURE', entite: 'Facture', entiteId: facture.id });
  res.status(201).json(facture);
}

export async function updateFactureHandler(req: Request, res: Response): Promise<void> {
  const data = factureContentSchema.parse(req.body);
  const facture = await facturesService.updateFacture(req.params.id as string, data, req.user?.role);
  await logAudit({ utilisateurId: req.user?.id, action: 'UPDATE_FACTURE', entite: 'Facture', entiteId: facture.id });
  res.json(facture);
}

export async function deleteFactureHandler(req: Request, res: Response): Promise<void> {
  await facturesService.deleteFacture(req.params.id as string, req.user?.role);
  await logAudit({ utilisateurId: req.user?.id, action: 'DELETE_FACTURE', entite: 'Facture', entiteId: req.params.id });
  res.status(204).end();
}

export async function envoyerFactureHandler(req: Request, res: Response): Promise<void> {
  const facture = await facturesService.envoyerFacture(req.params.id as string);
  await logAudit({ utilisateurId: req.user?.id, action: 'ENVOYER_FACTURE', entite: 'Facture', entiteId: facture.id });
  res.json(facture);
}

export async function annulerFactureHandler(req: Request, res: Response): Promise<void> {
  const facture = await facturesService.annulerFacture(req.params.id as string);
  await logAudit({ utilisateurId: req.user?.id, action: 'ANNULER_FACTURE', entite: 'Facture', entiteId: facture.id });
  res.json(facture);
}

export async function addPaiementHandler(req: Request, res: Response): Promise<void> {
  const data = createPaiementSchema.parse(req.body);
  const facture = await facturesService.addPaiement(req.params.id as string, data);
  await logAudit({
    utilisateurId: req.user?.id,
    action: 'ADD_PAIEMENT',
    entite: 'Facture',
    entiteId: facture.id,
    metadonnees: { montant: data.montant },
  });
  res.status(201).json(facture);
}

export async function deletePaiementHandler(req: Request, res: Response): Promise<void> {
  const facture = await facturesService.deletePaiement(req.params.id as string, req.params.paiementId as string);
  await logAudit({
    utilisateurId: req.user?.id,
    action: 'DELETE_PAIEMENT',
    entite: 'Facture',
    entiteId: facture.id,
    metadonnees: { paiementId: req.params.paiementId },
  });
  res.json(facture);
}
