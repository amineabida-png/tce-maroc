import type { StatutFacture } from '@prisma/client';
import { prisma } from '../../db/client';
import { computeTotaux } from '../../lib/money';
import { computeStockSummary } from '../../lib/stock';
import { listFactures } from '../factures/service';

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

interface DateRange {
  debut?: string;
  fin?: string;
}

function dateFilter({ debut, fin }: DateRange) {
  return debut && fin ? { gte: new Date(debut), lte: new Date(fin) } : undefined;
}

// Les factures BROUILLON n'ont jamais été émises et les ANNULEE ne
// représentent aucune activité réelle — exclues du chiffre d'affaires,
// cohérent avec le reste de l'app (ex. filtre impayeesUniquement).
const STATUTS_FACTURES_COMPTABILISEES: StatutFacture[] = ['ENVOYEE', 'PARTIELLEMENT_PAYEE', 'PAYEE', 'EN_RETARD'];

export interface LigneCA {
  periode: string; // AAAA-MM
  montantHT: number;
  montantTVA: number;
  montantTTC: number;
  montantEncaisse: number;
}

// Chiffre d'affaires par mois — jamais stocké, recalculé à partir des
// lignes de facture réelles (même principe que le reste de l'app).
export async function getRapportCA(range: DateRange, filters: { clientId?: string; chantierId?: string }) {
  const date = dateFilter(range);
  const factures = await prisma.facture.findMany({
    where: {
      statut: { in: STATUTS_FACTURES_COMPTABILISEES },
      ...(date ? { date } : {}),
      ...(filters.clientId ? { clientId: filters.clientId } : {}),
      ...(filters.chantierId ? { chantierId: filters.chantierId } : {}),
    },
    include: { lignes: true, paiements: { select: { montant: true } } },
    orderBy: { date: 'asc' },
  });

  const parMois = new Map<string, LigneCA>();
  for (const f of factures) {
    const periode = f.date.toISOString().slice(0, 7);
    const totaux = computeTotaux(f.lignes, f.tauxTva, f.tauxRetenueGarantie);
    const encaisse = f.paiements.reduce((sum, p) => sum + Number(p.montant), 0);

    const existing = parMois.get(periode) ?? { periode, montantHT: 0, montantTVA: 0, montantTTC: 0, montantEncaisse: 0 };
    existing.montantHT += totaux.montantHT;
    existing.montantTVA += totaux.montantTVA;
    existing.montantTTC += totaux.montantTTC;
    existing.montantEncaisse += encaisse;
    parMois.set(periode, existing);
  }

  const lignes = [...parMois.values()]
    .map((l) => ({
      periode: l.periode,
      montantHT: round2(l.montantHT),
      montantTVA: round2(l.montantTVA),
      montantTTC: round2(l.montantTTC),
      montantEncaisse: round2(l.montantEncaisse),
    }))
    .sort((a, b) => a.periode.localeCompare(b.periode));

  const total = lignes.reduce(
    (acc, l) => ({
      montantHT: acc.montantHT + l.montantHT,
      montantTVA: acc.montantTVA + l.montantTVA,
      montantTTC: acc.montantTTC + l.montantTTC,
      montantEncaisse: acc.montantEncaisse + l.montantEncaisse,
    }),
    { montantHT: 0, montantTVA: 0, montantTTC: 0, montantEncaisse: 0 }
  );

  return {
    lignes,
    total: { montantHT: round2(total.montantHT), montantTVA: round2(total.montantTVA), montantTTC: round2(total.montantTTC), montantEncaisse: round2(total.montantEncaisse) },
  };
}

export interface LigneMargeChantier {
  chantierId: string;
  chantierNom: string;
  recettesFacturees: number;
  depensesReelles: number;
  marge: number;
  coutMainDoeuvrePointages: number;
}

// Marge par chantier sur la période : recettes facturées - dépenses
// réelles (DepenseChantier, même source que le budget chantier existant).
// Le coût de main-d'œuvre issu des pointages est affiché séparément, à
// titre informatif, plutôt que soustrait de la marge : évite tout
// double-comptage si les pointages sont DÉJÀ répercutés manuellement dans
// une DepenseChantier catégorie MAIN_DOEUVRE (même principe que le rapport
// de coût de main-d'œuvre du module RH, jamais injecté automatiquement).
export async function getRapportMargeChantiers(range: DateRange) {
  const date = dateFilter(range);

  const chantiers = await prisma.chantier.findMany({ where: { actif: true }, select: { id: true, nom: true }, orderBy: { nom: 'asc' } });

  const [factures, depenses, pointages] = await Promise.all([
    prisma.facture.findMany({
      where: { statut: { in: STATUTS_FACTURES_COMPTABILISEES }, chantierId: { not: null }, ...(date ? { date } : {}) },
      select: { chantierId: true, tauxTva: true, tauxRetenueGarantie: true, lignes: true },
    }),
    prisma.depenseChantier.findMany({
      where: { ...(date ? { date } : {}) },
      select: { chantierId: true, montant: true },
    }),
    prisma.pointage.findMany({
      where: { statut: 'PRESENT', chantierId: { not: null }, ...(date ? { date } : {}) },
      select: { chantierId: true, nombreHeures: true, employe: { select: { tauxHoraire: true } } },
    }),
  ]);

  const recettesParChantier = new Map<string, number>();
  for (const f of factures) {
    if (!f.chantierId) continue;
    const { montantTTC } = computeTotaux(f.lignes, f.tauxTva, f.tauxRetenueGarantie);
    recettesParChantier.set(f.chantierId, (recettesParChantier.get(f.chantierId) ?? 0) + montantTTC);
  }

  const depensesParChantier = new Map<string, number>();
  for (const d of depenses) {
    depensesParChantier.set(d.chantierId, (depensesParChantier.get(d.chantierId) ?? 0) + Number(d.montant));
  }

  const coutMainDoeuvreParChantier = new Map<string, number>();
  for (const p of pointages) {
    if (!p.chantierId) continue;
    const cout = (Number(p.nombreHeures) || 0) * (Number(p.employe.tauxHoraire) || 0);
    coutMainDoeuvreParChantier.set(p.chantierId, (coutMainDoeuvreParChantier.get(p.chantierId) ?? 0) + cout);
  }

  const lignes: LigneMargeChantier[] = chantiers.map((c) => {
    const recettesFacturees = round2(recettesParChantier.get(c.id) ?? 0);
    const depensesReelles = round2(depensesParChantier.get(c.id) ?? 0);
    return {
      chantierId: c.id,
      chantierNom: c.nom,
      recettesFacturees,
      depensesReelles,
      marge: round2(recettesFacturees - depensesReelles),
      coutMainDoeuvrePointages: round2(coutMainDoeuvreParChantier.get(c.id) ?? 0),
    };
  });

  return lignes.filter((l) => l.recettesFacturees > 0 || l.depensesReelles > 0 || l.coutMainDoeuvrePointages > 0);
}

export interface LigneStock {
  articleId: string;
  nom: string;
  categorie: string | null;
  unite: string;
  quantiteEnStock: number;
  coutMoyenPondere: number;
  valorisation: number;
  sousLeSeuil: boolean;
}

// État global du stock — même calcul que le module Articles (jamais
// stocké), agrégé ici en vue portefeuille pour le reporting.
export async function getRapportStock() {
  const articles = await prisma.article.findMany({ where: { actif: true }, orderBy: { nom: 'asc' } });
  const mouvements = await prisma.mouvementStock.findMany({
    where: { articleId: { in: articles.map((a) => a.id) } },
    select: { articleId: true, type: true, quantite: true, prixUnitaire: true },
  });

  const mouvementsParArticle = new Map<string, typeof mouvements>();
  for (const m of mouvements) {
    const list = mouvementsParArticle.get(m.articleId) ?? [];
    list.push(m);
    mouvementsParArticle.set(m.articleId, list);
  }

  const lignes: LigneStock[] = articles.map((a) => {
    const summary = computeStockSummary(mouvementsParArticle.get(a.id) ?? [], a.seuilAlerte);
    return { articleId: a.id, nom: a.nom, categorie: a.categorie, unite: a.unite, ...summary };
  });

  const total = {
    valorisationTotale: round2(lignes.reduce((sum, l) => sum + l.valorisation, 0)),
    nombreArticles: lignes.length,
    nombreSousSeuil: lignes.filter((l) => l.sousLeSeuil).length,
  };

  return { lignes, total };
}

export interface LigneImpaye {
  clientId: string;
  clientNom: string;
  nombreFactures: number;
  montantRestant: number;
}

// Créances clients — regroupe les factures impayées (même source que
// l'échéancier du module Finances) par client, pour une vue synthétique.
export async function getRapportImpayes() {
  const result = await listFactures({ page: 1, pageSize: 200, skip: 0, q: '' }, { impayeesUniquement: true });

  const parClient = new Map<string, LigneImpaye>();
  for (const f of result.items) {
    const existing = parClient.get(f.clientId) ?? { clientId: f.clientId, clientNom: f.client.nom, nombreFactures: 0, montantRestant: 0 };
    existing.nombreFactures += 1;
    existing.montantRestant += f.montantRestantDu;
    parClient.set(f.clientId, existing);
  }

  const lignes = [...parClient.values()]
    .map((l) => ({ ...l, montantRestant: round2(l.montantRestant) }))
    .sort((a, b) => b.montantRestant - a.montantRestant);

  const total = round2(lignes.reduce((sum, l) => sum + l.montantRestant, 0));

  return { lignes, total };
}
