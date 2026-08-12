import type { Request, Response } from 'express';
import { logAudit } from '../../lib/audit';
import { parsePagination } from '../../lib/pagination';
import { createClientSchema, updateClientSchema } from './schema';
import * as clientsService from './service';

export async function listClientsHandler(req: Request, res: Response): Promise<void> {
  const params = parsePagination(req);
  const includeInactifs = req.query.includeInactifs === 'true';
  res.json(await clientsService.listClients(params, includeInactifs));
}

export async function getClientHandler(req: Request, res: Response): Promise<void> {
  res.json(await clientsService.getClient(req.params.id as string));
}

export async function createClientHandler(req: Request, res: Response): Promise<void> {
  const data = createClientSchema.parse(req.body);
  const client = await clientsService.createClient(data);
  await logAudit({ utilisateurId: req.user?.id, action: 'CREATE_CLIENT', entite: 'Client', entiteId: client.id });
  res.status(201).json(client);
}

export async function updateClientHandler(req: Request, res: Response): Promise<void> {
  const data = updateClientSchema.parse(req.body);
  const client = await clientsService.updateClient(req.params.id as string, data);
  await logAudit({ utilisateurId: req.user?.id, action: 'UPDATE_CLIENT', entite: 'Client', entiteId: client.id });
  res.json(client);
}

export async function deactivateClientHandler(req: Request, res: Response): Promise<void> {
  const client = await clientsService.deactivateClient(req.params.id as string);
  await logAudit({ utilisateurId: req.user?.id, action: 'DEACTIVATE_CLIENT', entite: 'Client', entiteId: client.id });
  res.json(client);
}

export async function reactivateClientHandler(req: Request, res: Response): Promise<void> {
  const client = await clientsService.reactivateClient(req.params.id as string);
  await logAudit({ utilisateurId: req.user?.id, action: 'REACTIVATE_CLIENT', entite: 'Client', entiteId: client.id });
  res.json(client);
}
