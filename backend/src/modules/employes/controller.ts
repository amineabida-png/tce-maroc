import type { Request, Response } from 'express';
import { logAudit } from '../../lib/audit';
import { toCsv } from '../../lib/csv';
import { parsePagination } from '../../lib/pagination';
import { AppError } from '../../middleware/errorHandler';
import { createEmployeSchema, updateEmployeSchema } from './schema';
import * as employesService from './service';

export async function listEmployesHandler(req: Request, res: Response): Promise<void> {
  const params = parsePagination(req);
  const includeInactifs = req.query.includeInactifs === 'true';
  res.json(await employesService.listEmployes(params, includeInactifs));
}

export async function getEmployeHandler(req: Request, res: Response): Promise<void> {
  res.json(await employesService.getEmploye(req.params.id as string));
}

export async function createEmployeHandler(req: Request, res: Response): Promise<void> {
  const data = createEmployeSchema.parse(req.body);
  const employe = await employesService.createEmploye(data);
  await logAudit({ utilisateurId: req.user?.id, action: 'CREATE_EMPLOYE', entite: 'Employe', entiteId: employe.id });
  res.status(201).json(employe);
}

export async function updateEmployeHandler(req: Request, res: Response): Promise<void> {
  const data = updateEmployeSchema.parse(req.body);
  const employe = await employesService.updateEmploye(req.params.id as string, data);
  await logAudit({ utilisateurId: req.user?.id, action: 'UPDATE_EMPLOYE', entite: 'Employe', entiteId: employe.id });
  res.json(employe);
}

export async function deactivateEmployeHandler(req: Request, res: Response): Promise<void> {
  const employe = await employesService.deactivateEmploye(req.params.id as string);
  await logAudit({ utilisateurId: req.user?.id, action: 'DEACTIVATE_EMPLOYE', entite: 'Employe', entiteId: employe.id });
  res.json(employe);
}

export async function reactivateEmployeHandler(req: Request, res: Response): Promise<void> {
  const employe = await employesService.reactivateEmploye(req.params.id as string);
  await logAudit({ utilisateurId: req.user?.id, action: 'REACTIVATE_EMPLOYE', entite: 'Employe', entiteId: employe.id });
  res.json(employe);
}

export async function exportPaieHandler(req: Request, res: Response): Promise<void> {
  const debutStr = typeof req.query.debut === 'string' ? req.query.debut : '';
  const finStr = typeof req.query.fin === 'string' ? req.query.fin : '';
  if (!debutStr || !finStr) throw new AppError(400, 'Les paramètres debut et fin (YYYY-MM-DD) sont obligatoires.');
  const debut = new Date(debutStr);
  const fin = new Date(finStr);
  if (Number.isNaN(debut.getTime()) || Number.isNaN(fin.getTime())) throw new AppError(400, 'Dates invalides.');

  const lignes = await employesService.computePaie(debut, fin);
  const csv = toCsv(lignes, [
    { key: 'nom', label: 'Nom' },
    { key: 'prenom', label: 'Prénom' },
    { key: 'cnss', label: 'N° CNSS' },
    { key: 'poste', label: 'Poste' },
    { key: 'typeContrat', label: 'Type de contrat' },
    { key: 'joursPresent', label: 'Jours présent' },
    { key: 'joursAbsent', label: 'Jours absent' },
    { key: 'joursConge', label: 'Jours congé' },
    { key: 'joursMaladie', label: 'Jours maladie' },
    { key: 'totalHeures', label: 'Total heures' },
    { key: 'tauxHoraire', label: 'Taux horaire (DH)' },
    { key: 'montantDu', label: 'Montant dû (DH)' },
  ]);

  await logAudit({ utilisateurId: req.user?.id, action: 'EXPORT_PAIE', metadonnees: { debut: debutStr, fin: finStr } });

  res.writeHead(200, {
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': `attachment; filename="paie_${debutStr}_${finStr}.csv"`,
  });
  res.end(csv);
}
