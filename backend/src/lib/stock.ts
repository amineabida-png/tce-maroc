// Calcul du niveau de stock et de sa valorisation — jamais stocké, toujours
// recalculé à partir du grand livre MouvementStock (même principe que
// lib/money.ts pour les documents commerciaux). Le coût moyen pondéré (CMP)
// est calculé globalement sur l'historique des ENTREE plutôt que recalculé
// de façon perpétuelle à chaque mouvement — simplification volontaire pour
// cette première version, suffisante pour la valorisation d'inventaire.
type Numeric = number | string | { toString(): string };

export interface MouvementPourCalcul {
  type: 'ENTREE' | 'SORTIE';
  quantite: Numeric;
  prixUnitaire: Numeric | null;
}

export interface StockSummary {
  quantiteEnStock: number;
  coutMoyenPondere: number;
  valorisation: number;
  sousLeSeuil: boolean;
}

function round(n: number, decimals: number): number {
  const f = 10 ** decimals;
  return Math.round((n + Number.EPSILON) * f) / f;
}

export function computeStockSummary(mouvements: MouvementPourCalcul[], seuilAlerte: Numeric | null = null): StockSummary {
  let totalEntreesQte = 0;
  let totalEntreesValeur = 0;
  let totalSortiesQte = 0;

  for (const m of mouvements) {
    const qte = Number(m.quantite) || 0;
    if (m.type === 'ENTREE') {
      totalEntreesQte += qte;
      totalEntreesValeur += qte * (Number(m.prixUnitaire) || 0);
    } else {
      totalSortiesQte += qte;
    }
  }

  const coutMoyenPondere = totalEntreesQte > 0 ? round(totalEntreesValeur / totalEntreesQte, 2) : 0;
  const quantiteEnStock = round(totalEntreesQte - totalSortiesQte, 3);
  const valorisation = round(quantiteEnStock * coutMoyenPondere, 2);
  const sousLeSeuil = seuilAlerte != null && quantiteEnStock <= Number(seuilAlerte);

  return { quantiteEnStock, coutMoyenPondere, valorisation, sousLeSeuil };
}
