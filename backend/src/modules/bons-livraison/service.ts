import { Prisma } from '@prisma/client';
import { prisma } from '../../db/client';
import { AppError } from '../../middleware/errorHandler';
import { nextNumero } from '../../lib/numerotation';
import { type PaginationParams, toPaginatedResult } from '../../lib/pagination';
import { getSociete } from '../societe/service';
import type { BonLivraisonContentInput } from './schema';

function normalizeEmptyToNull<T>(value: T | '' | null | undefined): T | null | undefined {
  if (value === undefined) return undefined;
  if (value === '') return null;
  return value as T;
}

const BL_INCLUDE = {
  client: { select: { id: true, nom: true, ice: true, adresse: true, ville: true } },
  chantier: { select: { id: true, nom: true } },
  commande: { select: { id: true, numero: true } },
  lignes: { orderBy: { ordre: 'asc' } },
} satisfies Prisma.BonLivraisonInclude;

export async function listBonsLivraison(params: PaginationParams, filters: { clientId?: string; chantierId?: string }) {
  const where: Prisma.BonLivraisonWhereInput = {
    ...(filters.clientId ? { clientId: filters.clientId } : {}),
    ...(filters.chantierId ? { chantierId: filters.chantierId } : {}),
    ...(params.q
      ? { OR: [{ numero: { contains: params.q, mode: 'insensitive' } }, { client: { nom: { contains: params.q, mode: 'insensitive' } } }] }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.bonLivraison.findMany({
      where,
      orderBy: { date: 'desc' },
      skip: params.skip,
      take: params.pageSize,
      include: { client: { select: { id: true, nom: true } }, chantier: { select: { id: true, nom: true } } },
    }),
    prisma.bonLivraison.count({ where }),
  ]);

  return toPaginatedResult(items, total, params);
}

async function fetchBonLivraisonOrThrow(id: string) {
  const bl = await prisma.bonLivraison.findUnique({ where: { id }, include: BL_INCLUDE });
  if (!bl) throw new AppError(404, 'Bon de livraison introuvable.');
  return bl;
}

export async function getBonLivraison(id: string) {
  return fetchBonLivraisonOrThrow(id);
}

async function creerLignes(tx: Prisma.TransactionClient, bonLivraisonId: string, lignes: BonLivraisonContentInput['lignes']) {
  for (let i = 0; i < lignes.length; i++) {
    const ligne = lignes[i]!;
    await tx.ligneBonLivraison.create({ data: { bonLivraisonId, ordre: i, ...ligne } });
  }
}

export async function createBonLivraison(data: BonLivraisonContentInput) {
  const societe = await getSociete();
  const numerotation = societe.numerotations.find((n) => n.typeDocument === 'BON_LIVRAISON');
  const numero = await nextNumero(societe.id, 'BON_LIVRAISON', numerotation?.prefixe ?? 'BL');

  const blId = await prisma.$transaction(async (tx) => {
    const bl = await tx.bonLivraison.create({
      data: {
        numero,
        clientId: data.clientId,
        chantierId: normalizeEmptyToNull(data.chantierId) ?? null,
        commandeId: normalizeEmptyToNull(data.commandeId) ?? null,
        lieuLivraison: data.lieuLivraison,
        notes: data.notes,
      },
    });
    await creerLignes(tx, bl.id, data.lignes);
    return bl.id;
  });

  return getBonLivraison(blId);
}

export async function updateBonLivraison(id: string, data: BonLivraisonContentInput) {
  const existing = await prisma.bonLivraison.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, 'Bon de livraison introuvable.');

  await prisma.$transaction(async (tx) => {
    await tx.ligneBonLivraison.deleteMany({ where: { bonLivraisonId: id } });
    await tx.bonLivraison.update({
      where: { id },
      data: {
        clientId: data.clientId,
        chantierId: normalizeEmptyToNull(data.chantierId) ?? null,
        commandeId: normalizeEmptyToNull(data.commandeId) ?? null,
        lieuLivraison: data.lieuLivraison,
        notes: data.notes,
      },
    });
    await creerLignes(tx, id, data.lignes);
  });

  return getBonLivraison(id);
}

export async function deleteBonLivraison(id: string): Promise<void> {
  const bl = await prisma.bonLivraison.findUnique({ where: { id } });
  if (!bl) throw new AppError(404, 'Bon de livraison introuvable.');
  await prisma.bonLivraison.delete({ where: { id } });
}

// Résumé pour la bannière de synthèse — total et nombre émis sur les 30
// derniers jours (pas de notion de statut/pipeline sur ce document).
export async function getResume() {
  const depuis30Jours = new Date();
  depuis30Jours.setDate(depuis30Jours.getDate() - 30);

  const [total, recents] = await Promise.all([
    prisma.bonLivraison.count(),
    prisma.bonLivraison.count({ where: { date: { gte: depuis30Jours } } }),
  ]);

  return { total, recents };
}
