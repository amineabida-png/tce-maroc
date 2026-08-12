export interface LigneCAMois {
  periode: string;
  montantHT: number;
  montantTVA: number;
  montantTTC: number;
  montantEncaisse: number;
}

export interface Dashboard {
  chantiersActifs: number;
  chantiersParStatut: { statut: string; nombre: number }[];
  caMoisCourant: { montantHT: number; montantTVA: number; montantTTC: number; montantEncaisse: number };
  caSixDerniersMois: LigneCAMois[];
  tresorerieDisponible: number;
  creancesClients: number;
  stockValorisation: number;
  stockSousSeuil: number;
  decaissementsPlanifies7j: number;
  facturesEnRetard: number;
  pointagesAujourdhui: number;
}
