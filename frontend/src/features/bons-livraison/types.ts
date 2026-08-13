export interface LigneBonLivraison {
  id: string;
  designation: string;
  unite: string;
  quantiteCommandee: string | null;
  quantiteLivree: string;
  observations: string | null;
  ordre: number;
}

export interface BonLivraisonSummary {
  id: string;
  numero: string;
  date: string;
  client: { id: string; nom: string };
  chantier: { id: string; nom: string } | null;
}

export interface BonLivraison extends BonLivraisonSummary {
  client: { id: string; nom: string; ice: string | null; adresse: string | null; ville: string | null };
  commande: { id: string; numero: string } | null;
  lieuLivraison: string | null;
  notes: string | null;
  lignes: LigneBonLivraison[];
}
