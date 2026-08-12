export interface LigneCA {
  periode: string;
  montantHT: number;
  montantTVA: number;
  montantTTC: number;
  montantEncaisse: number;
}
export interface RapportCA {
  lignes: LigneCA[];
  total: { montantHT: number; montantTVA: number; montantTTC: number; montantEncaisse: number };
}

export interface LigneMargeChantier {
  chantierId: string;
  chantierNom: string;
  recettesFacturees: number;
  depensesReelles: number;
  marge: number;
  coutMainDoeuvrePointages: number;
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
export interface RapportStock {
  lignes: LigneStock[];
  total: { valorisationTotale: number; nombreArticles: number; nombreSousSeuil: number };
}

export interface LigneImpaye {
  clientId: string;
  clientNom: string;
  nombreFactures: number;
  montantRestant: number;
}
export interface RapportImpayes {
  lignes: LigneImpaye[];
  total: number;
}
