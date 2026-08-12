// Solde d'un compte de trésorerie — jamais stocké, toujours recalculé à
// partir des Paiement (encaissements clients rattachés) et des
// MouvementTresorerie RÉALISÉS (les PREVU sont de simples échéances, ils ne
// modifient pas le solde réel) — même principe que le stock et le budget
// chantier.
type Numeric = number | string | { toString(): string };

export interface PaiementPourSolde {
  montant: Numeric;
}

export interface MouvementPourSolde {
  sens: 'ENCAISSEMENT' | 'DECAISSEMENT';
  statut: 'PREVU' | 'REALISE';
  montant: Numeric;
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function computeSoldeCompte(
  soldeInitial: Numeric,
  paiements: PaiementPourSolde[],
  mouvements: MouvementPourSolde[]
): number {
  let solde = Number(soldeInitial) || 0;
  for (const p of paiements) {
    solde += Number(p.montant) || 0;
  }
  for (const m of mouvements) {
    if (m.statut !== 'REALISE') continue;
    const montant = Number(m.montant) || 0;
    solde += m.sens === 'ENCAISSEMENT' ? montant : -montant;
  }
  return round2(solde);
}
