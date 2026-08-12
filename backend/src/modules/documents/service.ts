import type { TypeEntiteDocument } from '@prisma/client';
import { prisma } from '../../db/client';
import { AppError } from '../../middleware/errorHandler';

const SELECT_METADONNEES = {
  id: true,
  nom: true,
  typeMime: true,
  tailleOctets: true,
  entiteType: true,
  entiteId: true,
  createdAt: true,
  uploadedPar: { select: { id: true, nom: true, prenom: true } },
} as const;

export async function listDocuments(entiteType: TypeEntiteDocument, entiteId: string) {
  return prisma.document.findMany({
    where: { entiteType, entiteId },
    select: SELECT_METADONNEES,
    orderBy: { createdAt: 'desc' },
  });
}

export async function getDocumentAvecContenu(id: string) {
  const document = await prisma.document.findUnique({ where: { id } });
  if (!document) throw new AppError(404, 'Document introuvable.');
  return document;
}

export async function createDocument(data: {
  nom: string;
  typeMime: string;
  tailleOctets: number;
  contenu: Buffer;
  entiteType: TypeEntiteDocument;
  entiteId: string;
  uploadedById?: string;
}) {
  return prisma.document.create({ data, select: SELECT_METADONNEES });
}

export async function deleteDocument(id: string, demandeur: { id: string; role: string }): Promise<void> {
  const document = await prisma.document.findUnique({ where: { id }, select: { id: true, uploadedById: true } });
  if (!document) throw new AppError(404, 'Document introuvable.');

  const estAuteur = document.uploadedById === demandeur.id;
  const estEncadrement = demandeur.role === 'ADMIN' || demandeur.role === 'DIRECTEUR';
  if (!estAuteur && !estEncadrement) {
    throw new AppError(403, "Seul l'auteur du document ou l'encadrement peut le supprimer.");
  }

  await prisma.document.delete({ where: { id } });
}
