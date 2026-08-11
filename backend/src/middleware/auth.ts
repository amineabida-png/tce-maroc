import type { NextFunction, Request, Response } from 'express';
import { verifyAccessToken } from '../lib/jwt';

export interface AuthUser {
  id: string;
  role: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentification requise.' });
    return;
  }
  const token = header.slice('Bearer '.length);
  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    res.status(401).json({ error: 'Session invalide ou expirée.' });
  }
}

// À utiliser après requireAuth. Exemple : router.post('/', requireAuth, requireRole('ADMIN','DIRECTEUR'), ...)
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentification requise.' });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: "Vous n'avez pas les droits pour cette action." });
      return;
    }
    next();
  };
}
