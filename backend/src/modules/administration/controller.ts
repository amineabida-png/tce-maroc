import type { Request, Response } from 'express';
import { parsePagination } from '../../lib/pagination';
import * as service from './service';

function strParam(v: unknown): string | undefined {
  return typeof v === 'string' ? v : undefined;
}

export async function listJournalAuditHandler(req: Request, res: Response): Promise<void> {
  const params = parsePagination(req);
  res.json(
    await service.listJournalAudit(params, {
      utilisateurId: strParam(req.query.utilisateurId),
      action: strParam(req.query.action),
      entite: strParam(req.query.entite),
      debut: strParam(req.query.debut),
      fin: strParam(req.query.fin),
    })
  );
}

export async function listActionsDistinctesHandler(_req: Request, res: Response): Promise<void> {
  res.json(await service.listActionsDistinctes());
}
