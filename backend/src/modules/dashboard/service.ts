import { prisma } from '../../db/client';
import { listComptes } from '../comptes-tresorerie/service';
import { getEcheancier } from '../mouvements-tresorerie/service';
import { getRapportCA, getRapportImpayes, getRapportStock } from '../reporting/service';

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}
function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function endOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

const EMPTY_PAGINATION = { page: 1, pageSize: 100, skip: 0, q: '' };

// Vue synthétique — n'introduit aucun nouveau calcul : chaque chiffre
// réutilise le service du module correspondant (Reporting, Trésorerie,
// Facturation), pour ne jamais diverger de ce que ces modules affichent.
export async function getDashboard() {
  const now = new Date();
  const debutMois = new Date(now.getFullYear(), now.getMonth(), 1);
  const finMois = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const debutSixMois = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const dansSeptJours = new Date(now);
  dansSeptJours.setDate(dansSeptJours.getDate() + 7);

  const [
    chantiersParStatutRaw,
    caMoisCourant,
    caSixMois,
    comptes,
    impayes,
    stock,
    echeancier,
    facturesEnRetard,
    pointagesAujourdhui,
  ] = await Promise.all([
    prisma.chantier.groupBy({ by: ['statut'], where: { actif: true }, _count: true }),
    getRapportCA({ debut: iso(debutMois), fin: iso(finMois) }, {}),
    getRapportCA({ debut: iso(debutSixMois), fin: iso(finMois) }, {}),
    listComptes(EMPTY_PAGINATION, { includeInactifs: false }),
    getRapportImpayes(),
    getRapportStock(),
    getEcheancier(),
    prisma.facture.count({ where: { statut: { in: ['ENVOYEE', 'PARTIELLEMENT_PAYEE'] }, dateEcheance: { lt: now } } }),
    prisma.pointage.count({ where: { date: { gte: startOfDay(now), lte: endOfDay(now) }, statut: 'PRESENT' } }),
  ]);

  const chantiersParStatut = chantiersParStatutRaw.map((c) => ({ statut: c.statut, nombre: c._count }));
  const chantiersActifs = chantiersParStatut.reduce((sum, c) => sum + c.nombre, 0);

  const tresorerieDisponible = round2(comptes.items.reduce((sum, c) => sum + c.solde, 0));

  const decaissementsPlanifies7j = round2(
    echeancier.decaissementsPrevus.filter((m) => m.date <= dansSeptJours).reduce((sum, m) => sum + Number(m.montant), 0)
  );

  return {
    chantiersActifs,
    chantiersParStatut,
    caMoisCourant: caMoisCourant.total,
    caSixDerniersMois: caSixMois.lignes,
    tresorerieDisponible,
    creancesClients: impayes.total,
    stockValorisation: stock.total.valorisationTotale,
    stockSousSeuil: stock.total.nombreSousSeuil,
    decaissementsPlanifies7j,
    facturesEnRetard,
    pointagesAujourdhui,
  };
}
