import type { Request, Response } from 'express';
import { logAudit } from '../../lib/audit';
import { AppError } from '../../middleware/errorHandler';
import { listeDocumentsQuerySchema, uploadDocumentSchema } from './schema';
import * as service from './service';

export async function listDocumentsHandler(req: Request, res: Response): Promise<void> {
  const { entiteType, entiteId } = listeDocumentsQuerySchema.parse({
    entiteType: req.query.entiteType,
    entiteId: req.query.entiteId,
  });
  res.json(await service.listDocuments(entiteType, entiteId));
}

export async function uploadDocumentHandler(req: Request, res: Response): Promise<void> {
  if (!req.file) throw new AppError(400, 'Aucun fichier reçu.');
  const data = uploadDocumentSchema.parse(req.body);

  const document = await service.createDocument({
    nom: data.nom || req.file.originalname,
    typeMime: req.file.mimetype,
    tailleOctets: req.file.size,
    contenu: req.file.buffer,
    entiteType: data.entiteType,
    entiteId: data.entiteId,
    uploadedById: req.user?.id,
  });

  await logAudit({
    utilisateurId: req.user?.id,
    action: 'UPLOAD_DOCUMENT',
    entite: 'Document',
    entiteId: document.id,
    metadonnees: { nom: document.nom, entiteType: data.entiteType, entiteId: data.entiteId },
  });
  res.status(201).json(document);
}

export async function downloadDocumentHandler(req: Request, res: Response): Promise<void> {
  const document = await service.getDocumentAvecContenu(req.params.id as string);
  res.set({
    'Content-Type': document.typeMime,
    'Content-Disposition': `inline; filename="${encodeURIComponent(document.nom)}"`,
    'Content-Length': String(document.tailleOctets),
  });
  res.end(document.contenu);
}

export async function deleteDocumentHandler(req: Request, res: Response): Promise<void> {
  await service.deleteDocument(req.params.id as string, { id: req.user?.id as string, role: req.user?.role as string });
  await logAudit({ utilisateurId: req.user?.id, action: 'DELETE_DOCUMENT', entite: 'Document', entiteId: req.params.id });
  res.status(204).end();
}
