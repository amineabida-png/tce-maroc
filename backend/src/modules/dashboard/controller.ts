import type { Request, Response } from 'express';
import * as service from './service';

export async function getDashboardHandler(_req: Request, res: Response): Promise<void> {
  res.json(await service.getDashboard());
}
