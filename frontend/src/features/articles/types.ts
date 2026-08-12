export interface StockInfo {
  quantiteEnStock: number;
  coutMoyenPondere: number;
  valorisation: number;
  sousLeSeuil: boolean;
}

export interface Article {
  id: string;
  nom: string;
  categorie: string | null;
  unite: string;
  seuilAlerte: string | null;
  actif: boolean;
  stock: StockInfo;
}

export interface MouvementDetail {
  id: string;
  type: 'ENTREE' | 'SORTIE';
  quantite: string;
  prixUnitaire: string | null;
  date: string;
  notes: string | null;
  chantier: { id: string; nom: string } | null;
}

export interface ArticleDetail extends Article {
  mouvements: MouvementDetail[];
}
