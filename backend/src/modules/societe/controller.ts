import type { Request, Response } from 'express';
import { logAudit } from '../../lib/audit';
import { updateSocieteSchema, upsertNumerotationSchema } from './schema';
import * as societeService from './service';

export async function getSocieteHandler(req: Request, res: Response): Promise<void> {
  const societe = await societeService.getSociete();
  res.json(societe);
}

export async function updateSocieteHandler(req: Request, res: Response): Promise<void> {
  const data = updateSocieteSchema.parse(req.body);
  const societe = await societeService.updateSociete(data);
  await logAudit({ utilisateurId: req.user?.id, action: 'UPDATE_SOCIETE', entite: 'Societe', entiteId: societe.id });
  res.json(societe);
}

export async function upsertNumerotationHandler(req: Request, res: Response): Promise<void> {
  const data = upsertNumerotationSchema.parse(req.body);
  const numerotation = await societeService.upsertNumerotation(data);
  await logAudit({
    utilisateurId: req.user?.id,
    action: 'UPDATE_NUMEROTATION',
    entite: 'Numerotation',
    entiteId: numerotation.id,
    metadonnees: { typeDocument: data.typeDocument },
  });
  res.json(numerotation);
}
