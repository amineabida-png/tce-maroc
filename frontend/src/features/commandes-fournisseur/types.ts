import type { Totaux } from '@/lib/money';

export type StatutCommandeFournisseur = 'BROUILLON' | 'ENVOYEE' | 'PARTIELLEMENT_RECUE' | 'RECUE' | 'ANNULEE';

export const STATUT_CF_LABELS: Record<StatutCommandeFournisseur, string> = {
  BROUILLON: 'Brouillon',
  ENVOYEE: 'Envoyée',
  PARTIELLEMENT_RECUE: 'Partiellement reçue',
  RECUE: 'Reçue',
  ANNULEE: 'Annulée',
};

export const STATUT_CF_VARIANT: Record<StatutCommandeFournisseur, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  BROUILLON: 'outline',
  ENVOYEE: 'secondary',
  PARTIELLEMENT_RECUE: 'secondary',
  RECUE: 'default',
  ANNULEE: 'destructive',
};

export const STATUTS_MODIFIABLES: StatutCommandeFournisseur[] = ['BROUILLON'];
export const STATUTS_RECEPTIONNABLES: StatutCommandeFournisseur[] = ['ENVOYEE', 'PARTIELLEMENT_RECUE'];

export interface LigneCommandeFournisseur {
  id: string;
  articleId: string | null;
  article: { id: string; nom: string } | null;
  designation: string;
  unite: string;
  quantiteCommandee: string;
  quantiteRecue: string;
  prixUnitaire: string;
  ordre: number;
}

export interface CommandeFournisseurSummary {
  id: string;
  numero: string;
  statut: StatutCommandeFournisseur;
  date: string;
  fournisseur: { id: string; nom: string };
  chantier: { id: string; nom: string } | null;
  totaux: Totaux;
}

export interface CommandeFournisseurDetail extends CommandeFournisseurSummary {
  tauxTva: string;
  lignes: LigneCommandeFournisseur[];
  fournisseur: { id: string; nom: string; ice: string | null; adresse: string | null; ville: string | null };
}
