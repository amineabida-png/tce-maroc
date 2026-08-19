import type { Totaux } from '@/lib/money';

export type StatutSituation = 'BROUILLON' | 'ENVOYEE' | 'PAYEE' | 'ANNULEE';

export const STATUT_SITUATION_LABELS: Record<StatutSituation, string> = {
  BROUILLON: 'Brouillon',
  ENVOYEE: 'Envoyée',
  PAYEE: 'Payée',
  ANNULEE: 'Annulée',
};

export const STATUT_SITUATION_VARIANT: Record<StatutSituation, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  BROUILLON: 'outline',
  ENVOYEE: 'secondary',
  PAYEE: 'default',
  ANNULEE: 'destructive',
};

export const TRANSITIONS_AUTORISEES: Record<StatutSituation, StatutSituation[]> = {
  BROUILLON: ['ENVOYEE', 'ANNULEE'],
  ENVOYEE: ['PAYEE', 'ANNULEE'],
  PAYEE: [],
  ANNULEE: [],
};

export interface LigneSituation {
  id: string;
  designation: string;
  unite: string;
  quantiteMarche: string;
  prixUnitaire: string;
  avancementPrecedentPourcent: string;
  avancementCumulePourcent: string;
  ordre: number;
  montantMarche: number;
  montantCumule: number;
  montantPrecedent: number;
  montantSituation: number;
}

export interface MarcheRef {
  id: string;
  numero: string;
  client?: { id: string; nom: string; ice: string | null; adresse: string | null; ville: string | null };
  sousTraitant?: { id: string; nom: string; ice: string | null; adresse: string | null; ville: string | null };
}

export interface SituationSummary {
  id: string;
  numero: string;
  numeroSituation: number;
  date: string;
  statut: StatutSituation;
  commande: MarcheRef | null;
  contratSousTraitant: MarcheRef | null;
  chantier: { id: string; nom: string } | null;
  totaux: Totaux;
}

export interface Situation extends SituationSummary {
  tauxTva: string;
  tauxRetenueGarantie: string;
  lignes: LigneSituation[];
}
