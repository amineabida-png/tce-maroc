// Miroir du calcul serveur (backend/src/lib/money.ts) pour un aperçu des
// totaux en direct pendant la saisie — le serveur reste la seule source de
// vérité au moment de l'enregistrement (recalcul complet côté API).
export interface LigneMontant {
  quantite: number | string;
  prixUnitaire: number | string;
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function computeMontantHT(lignes: LigneMontant[]): number {
  return round2(lignes.reduce((sum, l) => sum + (Number(l.quantite) || 0) * (Number(l.prixUnitaire) || 0), 0));
}

export interface Totaux {
  montantHT: number;
  montantTVA: number;
  montantTTC: number;
  montantRetenueGarantie: number;
  montantNetAPayer: number;
}

export function computeTotaux(lignes: LigneMontant[], tauxTva: number | string, tauxRetenueGarantie: number | string = 0): Totaux {
  const montantHT = computeMontantHT(lignes);
  const montantTVA = round2(montantHT * ((Number(tauxTva) || 0) / 100));
  const montantTTC = round2(montantHT + montantTVA);
  const montantRetenueGarantie = round2(montantTTC * ((Number(tauxRetenueGarantie) || 0) / 100));
  const montantNetAPayer = round2(montantTTC - montantRetenueGarantie);
  return { montantHT, montantTVA, montantTTC, montantRetenueGarantie, montantNetAPayer };
}
