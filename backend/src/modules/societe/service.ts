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
  // "Prochain numéro" saisi par l'utilisateur = le prochain à émettre ; le
  // compteur interne stocke le DERNIER émis (nextNumero() l'incrémente
  // avant de s'en servir), d'où le -1. On repositionne aussi l'année
  // courante pour que ce numéro s'applique bien à la séquence de cette
  // année plutôt que d'être écrasé par la remise à zéro annuelle.
  const dernierNumero = input.prochainNumero !== undefined ? input.prochainNumero - 1 : undefined;

  return prisma.numerotation.upsert({
    where: { societeId_typeDocument: { societeId: societe.id, typeDocument: input.typeDocument } },
    update: {
      prefixe: input.prefixe,
      resetAnnuel: input.resetAnnuel ?? true,
      ...(dernierNumero !== undefined ? { dernierNumero, anneeCourante: currentYear } : {}),
    },
    create: {
      societeId: societe.id,
      typeDocument: input.typeDocument,
      prefixe: input.prefixe,
      resetAnnuel: input.resetAnnuel ?? true,
      anneeCourante: currentYear,
      dernierNumero: dernierNumero ?? 0,
    },
  });
}
