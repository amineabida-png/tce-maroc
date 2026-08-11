import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

// Erreur métier volontaire (ex. "Client introuvable"), distincte d'un bug :
// porte un code HTTP explicite et un message sûr à renvoyer tel quel.
export class AppError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({ error: 'Route introuvable.' });
}

// Point de sortie unique pour toutes les erreurs : format de réponse
// cohérent, et les détails internes (stack, erreurs Prisma brutes) ne
// fuitent jamais au client en production.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction): void {
  if (err instanceof ZodError) {
    res.status(400).json({ error: 'Données invalides.', details: err.flatten().fieldErrors });
    return;
  }
  if (err instanceof AppError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  console.error(err);
  res.status(500).json({ error: 'Erreur interne du serveur.' });
}
