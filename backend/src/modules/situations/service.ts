import { Prisma, type StatutSituation } from '@prisma/client';
import { prisma } from '../../db/client';
import { AppError } from '../../middleware/errorHandler';
import { computeTotaux } from '../../lib/money';
import { nextNumero } from '../../lib/numerotation';
import { type PaginationParams, toPaginatedResult } from '../../lib/pagination';
import { getSociete } from '../societe/service';
import type { LigneInput, SituationContentInput } from './schema';

function normalizeEmptyToNull<T>(value: T | '' | null | undefined): T | null | undefined {
  if (value === undefined) return undefined;
  if (value === '') return null;
  return value as T;
}

type MarcheField = 'commandeId' | 'contratSousTraitantId';

function marcheField(data: { commandeId?: string | null; contratSousTraitantId?: string | null }): MarcheField {
  return data.commandeId ? 'commandeId' : 'contratSousTraitantId';
}

const SITUATION_INCLUDE = {
  commande: { select: { id: true, numero: true, client: { select: { id: true, nom: true, ice: true, adresse: true, ville: true } } } },
  contratSousTraitant: {
    select: { id: true, numero: true, sousTraitant: { select: { id: true, nom: true, ice: true, adresse: true, ville: true } } },
  },
  chantier: { select: { id: true, nom: true } },
  lignes: { orderBy: { ordre: 'asc' } },
} satisfies Prisma.SituationInclude;

// Montant HT de CETTE situation pour une ligne = (montant marché × avancement
// cumulé) - (montant marché × avancement précédent) — jamais la valeur brute
// quantité×prix, qui serait le montant du marché entier, pas de l'étape.
function montantLigneSituation(l: { quantiteMarche: Prisma.Decimal | number | string; prixUnitaire: Prisma.Decimal | number | string; avancementCumulePourcent: Prisma.Decimal | number | string; avancementPrecedentPourcent: Prisma.Decimal | number | string }): number {
  const montantMarche = Number(l.quantiteMarche) * Number(l.prixUnitaire);
  const cumule = (montantMarche * Number(l.avancementCumulePourcent)) / 100;
  const precedent = (montantMarche * Number(l.avancementPrecedentPourcent)) / 100;
  return cumule - precedent;
}

function withTotaux<
  T extends {
    tauxTva: Prisma.Decimal;
    tauxRetenueGarantie: Prisma.Decimal;
    lignes: { quantiteMarche: Prisma.Decimal; prixUnitaire: Prisma.Decimal; avancementCumulePourcent: Prisma.Decimal; avancementPrecedentPourcent: Prisma.Decimal }[];
  },
>(situation: T) {
  const lignesAvecMontants = situation.lignes.map((l) => {
    const montantMarche = Number(l.quantiteMarche) * Number(l.prixUnitaire);
    const montantSituation = montantLigneSituation(l);
    return {
      ...l,
      montantMarche: Math.round(montantMarche * 100) / 100,
      montantCumule: Math.round(((montantMarche * Number(l.avancementCumulePourcent)) / 100) * 100) / 100,
      montantPrecedent: Math.round(((montantMarche * Number(l.avancementPrecedentPourcent)) / 100) * 100) / 100,
      montantSituation: Math.round(montantSituation * 100) / 100,
    };
  });
  // Réutilise computeTotaux (HT/TVA/TTC/retenue) en lui passant le montant
  // de la situation comme "prixUnitaire" d'une ligne fictive de quantité 1 —
  // évite de dupliquer la logique d'arrondi HT→TVA→TTC→retenue.
  const totaux = computeTotaux(
    lignesAvecMontants.map((l) => ({ quantite: 1, prixUnitaire: l.montantSituation })),
    situation.tauxTva,
    situation.tauxRetenueGarantie
  );
  return { ...situation, lignes: lignesAvecMontants, totaux };
}

async function fetchDerniereSituation(field: MarcheField, marcheId: string, excludeId?: string) {
  return prisma.situation.findFirst({
    where: { [field]: marcheId, ...(excludeId ? { id: { not: excludeId } } : {}) },
    orderBy: { numeroSituation: 'desc' },
    include: { lignes: { orderBy: { ordre: 'asc' } } },
  });
}

// Invariant structurel (s'applique à tout le monde, y compris ADMIN) : si une
// situation plus récente existe pour ce marché, la chaîne d'avancement
// casserait en modifiant/supprimant celle-ci — il faut passer par la plus
// récente.
async function assertEstLaDerniere(situation: { id: string; commandeId: string | null; contratSousTraitantId: string | null; numeroSituation: number }) {
  const field = marcheField(situation);
  const marcheId = (situation.commandeId ?? situation.contratSousTraitantId) as string;
  const plusRecente = await prisma.situation.count({
    where: { [field]: marcheId, numeroSituation: { gt: situation.numeroSituation } },
  });
  if (plusRecente > 0) {
    throw new AppError(409, 'Seule la dernière situation de ce marché peut être modifiée ou supprimée.');
  }
}

export async function listSituations(
  params: PaginationParams,
  filters: { commandeId?: string; contratSousTraitantId?: string; chantierId?: string; statut?: string }
) {
  const where: Prisma.SituationWhereInput = {
    ...(filters.commandeId ? { commandeId: filters.commandeId } : {}),
    ...(filters.contratSousTraitantId ? { contratSousTraitantId: filters.contratSousTraitantId } : {}),
    ...(filters.chantierId ? { chantierId: filters.chantierId } : {}),
    ...(filters.statut ? { statut: filters.statut as StatutSituation } : {}),
    ...(params.q ? { numero: { contains: params.q, mode: 'insensitive' } } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.situation.findMany({
      where,
      orderBy: { date: 'desc' },
      skip: params.skip,
      take: params.pageSize,
      include: {
        commande: { select: { id: true, numero: true, client: { select: { id: true, nom: true } } } },
        contratSousTraitant: { select: { id: true, numero: true, sousTraitant: { select: { id: true, nom: true } } } },
        chantier: { select: { id: true, nom: true } },
        lignes: true,
      },
    }),
    prisma.situation.count({ where }),
  ]);

  return toPaginatedResult(
    items.map((s) => withTotaux(s)),
    total,
    params
  );
}

async function fetchSituationOrThrow(id: string) {
  const situation = await prisma.situation.findUnique({ where: { id }, include: SITUATION_INCLUDE });
  if (!situation) throw new AppError(404, 'Situation introuvable.');
  return situation;
}

export async function getSituation(id: string) {
  return withTotaux(await fetchSituationOrThrow(id));
}

// Prévisualisation utilisée par le formulaire de création : renvoie, pour
// chaque ligne du marché choisi, la désignation/prix/quantité et
// l'avancement déjà facturé sur la dernière situation (0 si aucune) — sert
// à préremplir l'écran sans que l'utilisateur ressaisisse le marché.
export async function getEtatMarche(field: MarcheField, marcheId: string) {
  if (field === 'commandeId') {
    const commande = await prisma.commande.findUnique({ where: { id: marcheId }, include: { lignes: { orderBy: { ordre: 'asc' } } } });
    if (!commande) throw new AppError(404, 'Commande introuvable.');
    const derniere = await fetchDerniereSituation('commandeId', marcheId);
    return {
      tauxTva: Number(commande.tauxTva),
      chantierId: commande.chantierId,
      lignes: commande.lignes.map((l, i) => ({
        designation: l.designation,
        unite: l.unite,
        quantiteMarche: Number(l.quantite),
        prixUnitaire: Number(l.prixUnitaire),
        avancementPrecedent: derniere ? Number(derniere.lignes[i]?.avancementCumulePourcent ?? 0) : 0,
      })),
    };
  }
  const contrat = await prisma.contratSousTraitant.findUnique({ where: { id: marcheId }, include: { lignes: { orderBy: { ordre: 'asc' } } } });
  if (!contrat) throw new AppError(404, 'Contrat de sous-traitance introuvable.');
  const derniere = await fetchDerniereSituation('contratSousTraitantId', marcheId);
  return {
    tauxTva: Number(contrat.tauxTva),
    chantierId: contrat.chantierId,
    lignes: contrat.lignes.map((l, i) => ({
      designation: l.designation,
      unite: l.unite,
      quantiteMarche: Number(l.quantite),
      prixUnitaire: Number(l.prixUnitaire),
      avancementPrecedent: derniere ? Number(derniere.lignes[i]?.avancementCumulePourcent ?? 0) : 0,
    })),
  };
}

function validerAvancementCroissant(lignes: LigneInput[], precedents: number[]) {
  lignes.forEach((l, i) => {
    const precedent = precedents[i] ?? 0;
    if (l.avancementCumulePourcent < precedent) {
      throw new AppError(409, `Ligne ${i + 1} ("${l.designation}") : l'avancement cumulé (${l.avancementCumulePourcent}%) ne peut pas être inférieur au précédent (${precedent}%).`);
    }
  });
}

export async function createSituation(data: SituationContentInput) {
  const societe = await getSociete();
  const field = marcheField(data);
  const marcheId = (field === 'commandeId' ? data.commandeId : data.contratSousTraitantId) as string;

  const derniere = await fetchDerniereSituation(field, marcheId);
  const precedents = data.lignes.map((_, i) => (derniere ? Number(derniere.lignes[i]?.avancementCumulePourcent ?? 0) : 0));
  validerAvancementCroissant(data.lignes, precedents);

  const numeroSituation = (derniere?.numeroSituation ?? 0) + 1;
  const numerotation = societe.numerotations.find((n) => n.typeDocument === 'SITUATION');
  const numero = await nextNumero(societe.id, 'SITUATION', numerotation?.prefixe ?? 'SIT');

  let chantierId = normalizeEmptyToNull(data.chantierId) ?? null;
  if (!chantierId) {
    const marche = await getEtatMarche(field, marcheId);
    chantierId = marche.chantierId;
  }

  const situationId = await prisma.$transaction(async (tx) => {
    const situation = await tx.situation.create({
      data: {
        numero,
        numeroSituation,
        commandeId: field === 'commandeId' ? marcheId : null,
        contratSousTraitantId: field === 'contratSousTraitantId' ? marcheId : null,
        chantierId,
        tauxTva: data.tauxTva ?? societe.tauxTvaDefaut,
        tauxRetenueGarantie: data.tauxRetenueGarantie ?? societe.tauxRetenueGarantie,
      },
    });
    for (let i = 0; i < data.lignes.length; i++) {
      const ligne = data.lignes[i]!;
      await tx.ligneSituation.create({
        data: {
          situationId: situation.id,
          ordre: i,
          designation: ligne.designation,
          unite: ligne.unite,
          quantiteMarche: ligne.quantiteMarche,
          prixUnitaire: ligne.prixUnitaire,
          avancementCumulePourcent: ligne.avancementCumulePourcent,
          avancementPrecedentPourcent: precedents[i] ?? 0,
        },
      });
    }
    return situation.id;
  });

  return getSituation(situationId);
}

export async function updateSituation(id: string, data: SituationContentInput) {
  const existing = await prisma.situation.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, 'Situation introuvable.');
  await assertEstLaDerniere(existing);

  const field = marcheField(existing);
  const marcheId = (existing.commandeId ?? existing.contratSousTraitantId) as string;
  // Le "précédent" reste celui déjà figé à la création (la situation avant
  // celle-ci ne change pas) — recalculé depuis l'avant-dernière situation du
  // marché, jamais depuis celle qu'on est en train de modifier.
  const avantDerniere = await fetchDerniereSituation(field, marcheId, id);
  const precedents = data.lignes.map((_, i) => (avantDerniere ? Number(avantDerniere.lignes[i]?.avancementCumulePourcent ?? 0) : 0));
  validerAvancementCroissant(data.lignes, precedents);

  await prisma.$transaction(async (tx) => {
    await tx.ligneSituation.deleteMany({ where: { situationId: id } });
    await tx.situation.update({
      where: { id },
      data: {
        chantierId: normalizeEmptyToNull(data.chantierId) ?? existing.chantierId,
        tauxTva: data.tauxTva,
        tauxRetenueGarantie: data.tauxRetenueGarantie,
      },
    });
    for (let i = 0; i < data.lignes.length; i++) {
      const ligne = data.lignes[i]!;
      await tx.ligneSituation.create({
        data: {
          situationId: id,
          ordre: i,
          designation: ligne.designation,
          unite: ligne.unite,
          quantiteMarche: ligne.quantiteMarche,
          prixUnitaire: ligne.prixUnitaire,
          avancementCumulePourcent: ligne.avancementCumulePourcent,
          avancementPrecedentPourcent: precedents[i] ?? 0,
        },
      });
    }
  });

  return getSituation(id);
}

export async function deleteSituation(id: string): Promise<void> {
  const situation = await prisma.situation.findUnique({ where: { id } });
  if (!situation) throw new AppError(404, 'Situation introuvable.');
  await assertEstLaDerniere(situation);
  await prisma.situation.delete({ where: { id } });
}

export async function changeStatutSituation(id: string, statut: StatutSituation) {
  const situation = await prisma.situation.findUnique({ where: { id } });
  if (!situation) throw new AppError(404, 'Situation introuvable.');
  await prisma.situation.update({ where: { id }, data: { statut } });
  return getSituation(id);
}

export async function getResume() {
  const [total, envoyees] = await Promise.all([
    prisma.situation.count(),
    prisma.situation.findMany({
      where: { statut: 'ENVOYEE' },
      include: { lignes: true },
    }),
  ]);
  const montantEnAttente = envoyees.reduce((sum, s) => sum + withTotaux(s).totaux.montantNetAPayer, 0);
  return { total, montantEnAttente: Math.round(montantEnAttente * 100) / 100 };
}
