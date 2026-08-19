import { Prisma, type StatutContratSousTraitant } from '@prisma/client';
import { prisma } from '../../db/client';
import { AppError } from '../../middleware/errorHandler';
import { computeTotaux } from '../../lib/money';
import { nextNumero } from '../../lib/numerotation';
import { type PaginationParams, toPaginatedResult } from '../../lib/pagination';
import { isRoleManager } from '../../lib/roles';
import { getSociete } from '../societe/service';
import type { ContratSousTraitantContentInput } from './schema';

function normalizeEmptyToNull<T>(value: T | '' | null | undefined): T | null | undefined {
  if (value === undefined) return undefined;
  if (value === '') return null;
  return value as T;
}

const STATUTS_MODIFIABLES: StatutContratSousTraitant[] = ['BROUILLON'];

const TRANSITIONS_AUTORISEES: Record<StatutContratSousTraitant, StatutContratSousTraitant[]> = {
  BROUILLON: ['CONFIRME', 'ANNULE'],
  CONFIRME: ['TERMINE', 'ANNULE'],
  TERMINE: [],
  ANNULE: [],
};

const CST_INCLUDE = {
  sousTraitant: { select: { id: true, nom: true, ice: true, adresse: true, ville: true } },
  chantier: { select: { id: true, nom: true } },
  lignes: { orderBy: { ordre: 'asc' } },
} satisfies Prisma.ContratSousTraitantInclude;

function withTotaux<T extends { tauxTva: Prisma.Decimal; lignes: { quantite: Prisma.Decimal; prixUnitaire: Prisma.Decimal }[] }>(
  contrat: T
) {
  return { ...contrat, totaux: computeTotaux(contrat.lignes, contrat.tauxTva) };
}

// Un contrat ayant déjà des situations facturées ne peut plus voir ses
// lignes remplacées : les situations passées référencent le marché tel
// qu'il était (quantité/prix figés), les changer retroactivement fausserait
// l'avancement déjà facturé.
async function assertSansSituations(id: string): Promise<void> {
  const nb = await prisma.situation.count({ where: { contratSousTraitantId: id } });
  if (nb > 0) {
    throw new AppError(409, 'Ce contrat a déjà des situations émises — il ne peut plus être modifié ni supprimé.');
  }
}

export async function listContratsSousTraitance(
  params: PaginationParams,
  filters: { statut?: string; sousTraitantId?: string; chantierId?: string }
) {
  const where: Prisma.ContratSousTraitantWhereInput = {
    ...(filters.statut ? { statut: filters.statut as StatutContratSousTraitant } : {}),
    ...(filters.sousTraitantId ? { sousTraitantId: filters.sousTraitantId } : {}),
    ...(filters.chantierId ? { chantierId: filters.chantierId } : {}),
    ...(params.q
      ? {
          OR: [
            { numero: { contains: params.q, mode: 'insensitive' } },
            { sousTraitant: { nom: { contains: params.q, mode: 'insensitive' } } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.contratSousTraitant.findMany({
      where,
      orderBy: { date: 'desc' },
      skip: params.skip,
      take: params.pageSize,
      include: { sousTraitant: { select: { id: true, nom: true } }, chantier: { select: { id: true, nom: true } } },
    }),
    prisma.contratSousTraitant.count({ where }),
  ]);

  const withSums = await Promise.all(
    items.map(async (c) => {
      const lignes = await prisma.ligneContratSousTraitant.findMany({
        where: { contratSousTraitantId: c.id },
        select: { quantite: true, prixUnitaire: true },
      });
      return { ...c, totaux: computeTotaux(lignes, c.tauxTva) };
    })
  );

  return toPaginatedResult(withSums, total, params);
}

async function fetchContratOrThrow(id: string) {
  const contrat = await prisma.contratSousTraitant.findUnique({ where: { id }, include: CST_INCLUDE });
  if (!contrat) throw new AppError(404, 'Contrat de sous-traitance introuvable.');
  return contrat;
}

export async function getContratSousTraitant(id: string) {
  return withTotaux(await fetchContratOrThrow(id));
}

export async function createContratSousTraitant(data: ContratSousTraitantContentInput) {
  const societe = await getSociete();
  const numerotation = societe.numerotations.find((n) => n.typeDocument === 'CONTRAT_SOUS_TRAITANCE');
  const numero = await nextNumero(societe.id, 'CONTRAT_SOUS_TRAITANCE', numerotation?.prefixe ?? 'CST');

  const contratId = await prisma.$transaction(async (tx) => {
    const contrat = await tx.contratSousTraitant.create({
      data: {
        numero,
        sousTraitantId: data.sousTraitantId,
        chantierId: normalizeEmptyToNull(data.chantierId) ?? null,
        tauxTva: data.tauxTva ?? societe.tauxTvaDefaut,
      },
    });
    for (let i = 0; i < data.lignes.length; i++) {
      const ligne = data.lignes[i]!;
      await tx.ligneContratSousTraitant.create({ data: { contratSousTraitantId: contrat.id, ordre: i, ...ligne } });
    }
    return contrat.id;
  });

  return getContratSousTraitant(contratId);
}

export async function updateContratSousTraitant(id: string, data: ContratSousTraitantContentInput, role?: string) {
  const existing = await prisma.contratSousTraitant.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, 'Contrat de sous-traitance introuvable.');
  if (!STATUTS_MODIFIABLES.includes(existing.statut) && !isRoleManager(role)) {
    throw new AppError(409, 'Ce contrat ne peut plus être modifié (déjà confirmé, terminé ou annulé).');
  }
  await assertSansSituations(id);

  await prisma.$transaction(async (tx) => {
    await tx.ligneContratSousTraitant.deleteMany({ where: { contratSousTraitantId: id } });
    await tx.contratSousTraitant.update({
      where: { id },
      data: {
        sousTraitantId: data.sousTraitantId,
        chantierId: normalizeEmptyToNull(data.chantierId) ?? null,
        tauxTva: data.tauxTva,
      },
    });
    for (let i = 0; i < data.lignes.length; i++) {
      const ligne = data.lignes[i]!;
      await tx.ligneContratSousTraitant.create({ data: { contratSousTraitantId: id, ordre: i, ...ligne } });
    }
  });

  return getContratSousTraitant(id);
}

export async function deleteContratSousTraitant(id: string, role?: string): Promise<void> {
  const contrat = await prisma.contratSousTraitant.findUnique({ where: { id } });
  if (!contrat) throw new AppError(404, 'Contrat de sous-traitance introuvable.');
  if (contrat.statut !== 'BROUILLON' && !isRoleManager(role)) {
    throw new AppError(409, 'Seul un contrat en brouillon peut être supprimé.');
  }
  await assertSansSituations(id);
  await prisma.contratSousTraitant.delete({ where: { id } });
}

export async function changeStatutContratSousTraitant(id: string, nouveauStatut: StatutContratSousTraitant) {
  const contrat = await prisma.contratSousTraitant.findUnique({ where: { id } });
  if (!contrat) throw new AppError(404, 'Contrat de sous-traitance introuvable.');
  const autorises = TRANSITIONS_AUTORISEES[contrat.statut];
  if (!autorises.includes(nouveauStatut)) {
    throw new AppError(409, `Transition de statut invalide : ${contrat.statut} → ${nouveauStatut}.`);
  }
  await prisma.contratSousTraitant.update({ where: { id }, data: { statut: nouveauStatut } });
  return getContratSousTraitant(id);
}

export async function getResume() {
  const [total, enCours] = await Promise.all([
    prisma.contratSousTraitant.count(),
    prisma.contratSousTraitant.findMany({
      where: { statut: { in: ['BROUILLON', 'CONFIRME'] } },
      select: { tauxTva: true, lignes: { select: { quantite: true, prixUnitaire: true } } },
    }),
  ]);
  const montantEngage = enCours.reduce((sum, c) => sum + computeTotaux(c.lignes, c.tauxTva).montantTTC, 0);
  return { total, montantEngage: Math.round(montantEngage * 100) / 100 };
}
