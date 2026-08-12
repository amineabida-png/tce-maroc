// Calculs monétaires partagés (Devis, Commande, Facture) — jamais stockés,
// toujours recalculés à partir des lignes réelles pour ne jamais se
// désynchroniser d'une modification. Arrondi au centime à chaque étape
// (HT → TVA → TTC → retenue) plutôt qu'une seule fois à la fin, pour
// correspondre à ce qu'un comptable obtiendrait en calculant à la main.
// Accepte aussi Prisma.Decimal (objet avec toString/valueOf, sur lequel
// Number() se coerce correctement à l'exécution) sans coupler ce module
// utilitaire au client Prisma généré.
type Numeric = number | string | { toString(): string };

export interface LigneMontant {
  quantite: Numeric;
  prixUnitaire: Numeric;
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function computeMontantHT(lignes: LigneMontant[]): number {
  return round2(lignes.reduce((sum, l) => sum + Number(l.quantite) * Number(l.prixUnitaire), 0));
}

export interface Totaux {
  montantHT: number;
  montantTVA: number;
  montantTTC: number;
  montantRetenueGarantie: number;
  montantNetAPayer: number;
}

export function computeTotaux(lignes: LigneMontant[], tauxTva: Numeric, tauxRetenueGarantie: Numeric = 0): Totaux {
  const montantHT = computeMontantHT(lignes);
  const montantTVA = round2(montantHT * (Number(tauxTva) / 100));
  const montantTTC = round2(montantHT + montantTVA);
  const montantRetenueGarantie = round2(montantTTC * (Number(tauxRetenueGarantie) / 100));
  const montantNetAPayer = round2(montantTTC - montantRetenueGarantie);
  return { montantHT, montantTVA, montantTTC, montantRetenueGarantie, montantNetAPayer };
}
