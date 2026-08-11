import type { NextFunction, Request, Response } from 'express';

type AsyncRoute = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

// Évite un try/catch répété dans chaque route async : toute rejection est
// transmise à errorHandler au lieu de planter le process (piège classique
// d'Express avec des handlers async).
export function asyncHandler(fn: AsyncRoute) {
  return (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };
}
