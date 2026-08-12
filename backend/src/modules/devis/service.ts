import { Prisma, type StatutDevis } from '@prisma/client';
import { prisma } from '../../db/client';
import { AppError } from '../../middleware/errorHandler';
import { computeTotaux } from '../../lib/money';
import { nextNumero } from '../../lib/numerotation';
import { type PaginationParams, toPaginatedResult } from '../../lib/pagination';
import { getSociete } from '../societe/service';
import type { DevisContentInput } from './schema';

type Tx = Prisma.TransactionClient;

function normalizeEmptyToNull<T>(value: T | '' | null | undefined): T | null | undefined {
  if (value === undefined) return undefined;
  if (value === '') return null;
  return value as T;
}
function normalizeDate(value: string | null | undefined | ''): Date | null | undefined {
  const v = normalizeEmptyToNull(value);
  if (v === undefined || v === null) return v;
  return new Date(v);
}

// Un devis n'est modifiable en contenu que tant qu'il n'a pas été engagé
// (accepté/converti) — une fois accepté, il sert de référence figée pour la
// commande/facture qui en découle.
const STATUTS_MODIFIABLES: StatutDevis[] = ['BROUILLON', 'ENVOYE'];

const TRANSITIONS_AUTORISEES: Record<StatutDevis, StatutDevis[]> = {
  BROUILLON: ['ENVOYE'],
  ENVOYE: ['ACCEPTE', 'REFUSE', 'EXPIRE', 'BROUILLON'],
  ACCEPTE: [],
  REFUSE: ['BROUILLON'],
  EXPIRE: ['BROUILLON'],
  CONVERTI: [],
};

const DEVIS_INCLUDE = {
  client: { select: { id: true, nom: true } },
  chantier: { select: { id: true, nom: true } },
  lots: { orderBy: { ordre: 'asc' }, include: { lignes: { orderBy: { ordre: 'asc' } } } },
  lignes: { where: { lotId: null }, orderBy: { ordre: 'asc' } },
} satisfies Prisma.DevisInclude;

function withTotaux<T extends { tauxTva: Prisma.Decimal; lots: { lignes: { quantite: Prisma.Decimal; prixUnitaire: Prisma.Decimal }[] }[]; lignes: { quantite: Prisma.Decimal; prixUnitaire: Prisma.Decimal }[] }>(
  devis: T
) {
  const toutesLesLignes = [...devis.lots.flatMap((l) => l.lignes), ...devis.lignes];
  const totaux = computeTotaux(toutesLesLignes, devis.tauxTva);
  return { ...devis, lignesSansLot: devis.lignes, totaux };
}

export async function listDevis(params: PaginationParams, filters: { statut?: string; clientId?: string; chantierId?: string }) {
  const where: Prisma.DevisWhereInput = {
    ...(filters.statut ? { statut: filters.statut as StatutDevis } : {}),
    ...(filters.clientId ? { clientId: filters.clientId } : {}),
    ...(filters.chantierId ? { chantierId: filters.chantierId } : {}),
    ...(params.q
      ? { OR: [{ numero: { contains: params.q, mode: 'insensitive' } }, { client: { nom: { contains: params.q, mode: 'insensitive' } } }] }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.devis.findMany({
      where,
      orderBy: { date: 'desc' },
      skip: params.skip,
      take: params.pageSize,
      include: { client: { select: { id: true, nom: true } }, chantier: { select: { id: true, nom: true } } },
    }),
    prisma.devis.count({ where }),
  ]);

  // Totaux calculés séparément pour la liste (pas besoin des lots/lignes
  // complets, juste la somme) afin de ne pas surcharger la requête liste.
  const withSums = await Promise.all(
    items.map(async (d) => {
      const lignes = await prisma.ligneDevis.findMany({ where: { devisId: d.id }, select: { quantite: true, prixUnitaire: true } });
      return { ...d, totaux: computeTotaux(lignes, d.tauxTva) };
    })
  );

  return toPaginatedResult(withSums, total, params);
}

async function fetchDevisOrThrow(id: string, tx: Tx | typeof prisma = prisma) {
  const devis = await tx.devis.findUnique({ where: { id }, include: DEVIS_INCLUDE });
  if (!devis) throw new AppError(404, 'Devis introuvable.');
  return devis;
}

export async function getDevis(id: string) {
  return withTotaux(await fetchDevisOrThrow(id));
}

async function creerLotsEtLignes(tx: Tx, devisId: string, data: DevisContentInput) {
  for (let lotIdx = 0; lotIdx < data.lots.length; lotIdx++) {
    const lot = data.lots[lotIdx]!;
    const createdLot = await tx.lotDevis.create({ data: { devisId, nom: lot.nom, ordre: lotIdx } });
    for (let ligneIdx = 0; ligneIdx < lot.lignes.length; ligneIdx++) {
      const ligne = lot.lignes[ligneIdx]!;
      await tx.ligneDevis.create({ data: { devisId, lotId: createdLot.id, ordre: ligneIdx, ...ligne } });
    }
  }
  for (let ligneIdx = 0; ligneIdx < data.lignesSansLot.length; ligneIdx++) {
    const ligne = data.lignesSansLot[ligneIdx]!;
    await tx.ligneDevis.create({ data: { devisId, lotId: null, ordre: ligneIdx, ...ligne } });
  }
}

export async function createDevis(data: DevisContentInput) {
  const societe = await getSociete();
  const numerotation = societe.numerotations.find((n) => n.typeDocument === 'DEVIS');
  const numero = await nextNumero(societe.id, 'DEVIS', numerotation?.prefixe ?? 'DEV');

  const devisId = await prisma.$transaction(async (tx) => {
    const devis = await tx.devis.create({
      data: {
        numero,
        clientId: data.clientId,
        chantierId: normalizeEmptyToNull(data.chantierId) ?? null,
        dateValidite: normalizeDate(data.dateValidite) ?? null,
        tauxTva: data.tauxTva ?? societe.tauxTvaDefaut,
        conditions: data.conditions,
      },
    });
    await creerLotsEtLignes(tx, devis.id, data);
    return devis.id;
  });

  return getDevis(devisId);
}

export async function updateDevis(id: string, data: DevisContentInput) {
  const existing = await prisma.devis.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, 'Devis introuvable.');
  if (!STATUTS_MODIFIABLES.includes(existing.statut)) {
    throw new AppError(409, 'Ce devis ne peut plus être modifié (déjà accepté, refusé ou converti).');
  }

  await prisma.$transaction(async (tx) => {
    await tx.ligneDevis.deleteMany({ where: { devisId: id } });
    await tx.lotDevis.deleteMany({ where: { devisId: id } });
    await tx.devis.update({
      where: { id },
      data: {
        clientId: data.clientId,
        chantierId: normalizeEmptyToNull(data.chantierId) ?? null,
        dateValidite: normalizeDate(data.dateValidite) ?? null,
        tauxTva: data.tauxTva,
        conditions: data.conditions,
      },
    });
    await creerLotsEtLignes(tx, id, data);
  });

  return getDevis(id);
}

export async function deleteDevis(id: string): Promise<void> {
  const devis = await prisma.devis.findUnique({ where: { id } });
  if (!devis) throw new AppError(404, 'Devis introuvable.');
  if (devis.statut !== 'BROUILLON') throw new AppError(409, 'Seul un devis en brouillon peut être supprimé.');
  await prisma.devis.delete({ where: { id } });
}

export async function changeStatutDevis(id: string, nouveauStatut: StatutDevis) {
  const devis = await prisma.devis.findUnique({ where: { id } });
  if (!devis) throw new AppError(404, 'Devis introuvable.');
  const autorises = TRANSITIONS_AUTORISEES[devis.statut];
  if (!autorises.includes(nouveauStatut)) {
    throw new AppError(409, `Transition de statut invalide : ${devis.statut} → ${nouveauStatut}.`);
  }
  await prisma.devis.update({ where: { id }, data: { statut: nouveauStatut } });
  return getDevis(id);
}

// Conversion en bon de commande : copie figée des lignes (pas de lien
// vivant) — une modification ultérieure du devis (déjà bloquée par son
// statut CONVERTI) ne doit de toute façon jamais impacter une commande déjà
// émise.
export async function convertirEnCommande(id: string) {
  const devis = await fetchDevisOrThrow(id);
  if (devis.statut !== 'ACCEPTE') {
    throw new AppError(409, 'Seul un devis accepté peut être converti en bon de commande.');
  }

  const societe = await getSociete();
  const numerotation = societe.numerotations.find((n) => n.typeDocument === 'BON_COMMANDE');
  const numero = await nextNumero(societe.id, 'BON_COMMANDE', numerotation?.prefixe ?? 'BC');

  const toutesLesLignes = [...devis.lots.flatMap((l) => l.lignes), ...devis.lignes];

  const commandeId = await prisma.$transaction(async (tx) => {
    const commande = await tx.commande.create({
      data: {
        numero,
        devisId: devis.id,
        clientId: devis.clientId,
        chantierId: devis.chantierId,
        tauxTva: devis.tauxTva,
        statut: 'BROUILLON',
      },
    });
    for (let i = 0; i < toutesLesLignes.length; i++) {
      const ligne = toutesLesLignes[i]!;
      await tx.ligneCommande.create({
        data: {
          commandeId: commande.id,
          designation: ligne.designation,
          unite: ligne.unite,
          quantite: ligne.quantite,
          prixUnitaire: ligne.prixUnitaire,
          ordre: i,
        },
      });
    }
    await tx.devis.update({ where: { id: devis.id }, data: { statut: 'CONVERTI' } });
    return commande.id;
  });

  return commandeId;
}

// Résumé pour la bannière de synthèse en tête de la liste des devis —
// répartition par statut + montant total du pipeline en cours (devis pas
// encore refusés/expirés/convertis). Jamais stocké, recalculé à la demande.
const STATUTS_PIPELINE: StatutDevis[] = ['BROUILLON', 'ENVOYE', 'ACCEPTE'];

export async function getResume() {
  const [parStatutRaw, enCours] = await Promise.all([
    prisma.devis.groupBy({ by: ['statut'], _count: true }),
    prisma.devis.findMany({
      where: { statut: { in: STATUTS_PIPELINE } },
      select: { tauxTva: true, lignes: { select: { quantite: true, prixUnitaire: true } } },
    }),
  ]);

  const parStatut = parStatutRaw.map((s) => ({ statut: s.statut, nombre: s._count }));
  const montantPipeline = enCours.reduce((sum, d) => sum + computeTotaux(d.lignes, d.tauxTva).montantTTC, 0);
  const total = parStatut.reduce((sum, s) => sum + s.nombre, 0);
  const accepte = parStatut.find((s) => s.statut === 'ACCEPTE')?.nombre ?? 0;
  const refuse = parStatut.find((s) => s.statut === 'REFUSE')?.nombre ?? 0;
  const clos = accepte + refuse + (parStatut.find((s) => s.statut === 'CONVERTI')?.nombre ?? 0);
  const tauxConversion = clos > 0 ? Math.round(((accepte + (parStatut.find((s) => s.statut === 'CONVERTI')?.nombre ?? 0)) / clos) * 100) : null;

  return {
    total,
    parStatut,
    montantPipeline: Math.round(montantPipeline * 100) / 100,
    tauxConversion,
  };
}
