export type StatutChantier = 'EN_PREPARATION' | 'EN_COURS' | 'EN_RETARD' | 'SUSPENDU' | 'TERMINE' | 'ANNULE';
export type StatutTache = 'A_FAIRE' | 'EN_COURS' | 'TERMINEE' | 'BLOQUEE';
export type CategorieDepense = 'MAIN_DOEUVRE' | 'MATERIAUX' | 'SOUS_TRAITANCE' | 'LOCATION_MATERIEL' | 'AUTRE';

export const STATUT_CHANTIER_LABELS: Record<StatutChantier, string> = {
  EN_PREPARATION: 'En préparation',
  EN_COURS: 'En cours',
  EN_RETARD: 'En retard',
  SUSPENDU: 'Suspendu',
  TERMINE: 'Terminé',
  ANNULE: 'Annulé',
};

export const STATUT_CHANTIER_VARIANT: Record<StatutChantier, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  EN_PREPARATION: 'outline',
  EN_COURS: 'default',
  EN_RETARD: 'destructive',
  SUSPENDU: 'secondary',
  TERMINE: 'secondary',
  ANNULE: 'destructive',
};

export const STATUT_TACHE_LABELS: Record<StatutTache, string> = {
  A_FAIRE: 'À faire',
  EN_COURS: 'En cours',
  TERMINEE: 'Terminée',
  BLOQUEE: 'Bloquée',
};

export const CATEGORIE_DEPENSE_LABELS: Record<CategorieDepense, string> = {
  MAIN_DOEUVRE: "Main-d'œuvre",
  MATERIAUX: 'Matériaux',
  SOUS_TRAITANCE: 'Sous-traitance',
  LOCATION_MATERIEL: 'Location matériel',
  AUTRE: 'Autre',
};

export interface ChantierSummary {
  id: string;
  nom: string;
  ville: string | null;
  budgetPrevisionnel: string | null;
  dateDebut: string | null;
  dateFinPrevue: string | null;
  dateFinReelle: string | null;
  avancement: number;
  statut: StatutChantier;
  actif: boolean;
  client: { id: string; nom: string } | null;
  conducteur: { id: string; nom: string; prenom: string } | null;
}

export interface Chantier extends ChantierSummary {
  clientId: string | null;
  conducteurId: string | null;
  adresse: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  taches: TacheChantier[];
}

export interface TacheChantier {
  id: string;
  chantierId: string;
  nom: string;
  dateDebut: string | null;
  dateFin: string | null;
  avancement: number;
  statut: StatutTache;
  ordre: number;
  predecesseurId: string | null;
}

export interface DepenseChantier {
  id: string;
  chantierId: string;
  categorie: CategorieDepense;
  montant: string;
  date: string;
  description: string | null;
  fournisseur: { id: string; nom: string } | null;
  sousTraitant: { id: string; nom: string } | null;
}

export interface BudgetSummary {
  budgetPrevisionnel: number | null;
  totalReel: number;
  ecart: number | null;
  parCategorie: { categorie: CategorieDepense; montant: number }[];
}
