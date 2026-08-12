import type { Request, Response } from 'express';
import { prisma } from '../../db/client';

// Liste minimale, en lecture seule, utilisée pour les sélecteurs (ex.
// assigner un conducteur de travaux à un chantier). La gestion complète des
// comptes (création, rôles, désactivation) est du ressort du futur module
// Administration — volontairement pas dupliquée ici.
export async function listUtilisateursHandler(req: Request, res: Response): Promise<void> {
  const role = typeof req.query.role === 'string' ? req.query.role : undefined;
  const utilisateurs = await prisma.utilisateur.findMany({
    where: { actif: true, ...(role ? { role: role as never } : {}) },
    select: { id: true, nom: true, prenom: true, role: true },
    orderBy: { prenom: 'asc' },
  });
  res.json(utilisateurs);
}
