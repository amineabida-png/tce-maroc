import { prisma } from '../../db/client';
import { AppError } from '../../middleware/errorHandler';
import type { UpdateSocieteInput, UpsertNumerotationInput } from './schema';

// L'app gère une seule société : cette fonction la récupère (elle existe
// toujours après le seed) au lieu d'exposer un id à connaître côté client.
export async function getSociete() {
  const societe = await prisma.societe.findFirst({ orderBy: { createdAt: 'asc' }, include: { numerotations: true } });
  if (!societe) throw new AppError(404, "Paramètres société non initialisés.");
  return societe;
}

export async function updateSociete(data: UpdateSocieteInput) {
  const societe = await getSociete();
  return prisma.societe.update({ where: { id: societe.id }, data });
}

export async function upsertNumerotation(input: UpsertNumerotationInput) {
  const societe = await getSociete();
  const currentYear = new Date().getFullYear();
  return prisma.numerotation.upsert({
    where: { societeId_typeDocument: { societeId: societe.id, typeDocument: input.typeDocument } },
    update: { prefixe: input.prefixe, resetAnnuel: input.resetAnnuel ?? true },
    create: {
      societeId: societe.id,
      typeDocument: input.typeDocument,
      prefixe: input.prefixe,
      resetAnnuel: input.resetAnnuel ?? true,
      anneeCourante: currentYear,
      dernierNumero: 0,
    },
  });
}
