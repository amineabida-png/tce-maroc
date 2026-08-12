import type { Request, Response } from 'express';
import { logAudit } from '../../lib/audit';
import { createUtilisateurSchema, reinitialiserMotDePasseSchema, updateUtilisateurSchema } from './schema';
import * as service from './service';

export async function listUtilisateursHandler(req: Request, res: Response): Promise<void> {
  const role = typeof req.query.role === 'string' ? req.query.role : undefined;
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : undefined;
  const includeInactifs = req.query.includeInactifs === 'true';
  res.json(await service.listUtilisateurs({ role, q, includeInactifs }));
}

export async function createUtilisateurHandler(req: Request, res: Response): Promise<void> {
  const data = createUtilisateurSchema.parse(req.body);
  const utilisateur = await service.createUtilisateur(data);
  await logAudit({
    utilisateurId: req.user?.id,
    action: 'CREATE_UTILISATEUR',
    entite: 'Utilisateur',
    entiteId: utilisateur.id,
    metadonnees: { email: data.email, role: data.role },
  });
  res.status(201).json(utilisateur);
}

export async function updateUtilisateurHandler(req: Request, res: Response): Promise<void> {
  const data = updateUtilisateurSchema.parse(req.body);
  const utilisateur = await service.updateUtilisateur(req.params.id as string, data);
  await logAudit({ utilisateurId: req.user?.id, action: 'UPDATE_UTILISATEUR', entite: 'Utilisateur', entiteId: utilisateur.id, metadonnees: data });
  res.json(utilisateur);
}

export async function deactivateUtilisateurHandler(req: Request, res: Response): Promise<void> {
  const utilisateur = await service.deactivateUtilisateur(req.params.id as string, req.user?.id as string);
  await logAudit({ utilisateurId: req.user?.id, action: 'DEACTIVATE_UTILISATEUR', entite: 'Utilisateur', entiteId: utilisateur.id });
  res.json(utilisateur);
}

export async function reactivateUtilisateurHandler(req: Request, res: Response): Promise<void> {
  const utilisateur = await service.reactivateUtilisateur(req.params.id as string);
  await logAudit({ utilisateurId: req.user?.id, action: 'REACTIVATE_UTILISATEUR', entite: 'Utilisateur', entiteId: utilisateur.id });
  res.json(utilisateur);
}

export async function reinitialiserMotDePasseHandler(req: Request, res: Response): Promise<void> {
  const data = reinitialiserMotDePasseSchema.parse(req.body);
  await service.reinitialiserMotDePasse(req.params.id as string, data.nouveauMotDePasse);
  await logAudit({
    utilisateurId: req.user?.id,
    action: 'REINITIALISER_MOT_DE_PASSE',
    entite: 'Utilisateur',
    entiteId: req.params.id,
  });
  res.status(204).end();
}
