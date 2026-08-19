import type { Totaux } from '@/lib/money';

export type StatutContratSousTraitant = 'BROUILLON' | 'CONFIRME' | 'TERMINE' | 'ANNULE';

export const STATUT_CST_LABELS: Record<StatutContratSousTraitant, string> = {
  BROUILLON: 'Brouillon',
  CONFIRME: 'Confirmé',
  TERMINE: 'Terminé',
  ANNULE: 'Annulé',
};

export const STATUT_CST_VARIANT: Record<StatutContratSousTraitant, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  BROUILLON: 'outline',
  CONFIRME: 'default',
  TERMINE: 'secondary',
  ANNULE: 'destructive',
};

export const STATUTS_MODIFIABLES: StatutContratSousTraitant[] = ['BROUILLON'];

export interface LigneContratSousTraitant {
  id: string;
  designation: string;
  unite: string;
  quantite: string;
  prixUnitaire: string;
  ordre: number;
}

export interface ContratSousTraitantSummary {
  id: string;
  numero: string;
  statut: StatutContratSousTraitant;
  date: string;
  sousTraitant: { id: string; nom: string };
  chantier: { id: string; nom: string } | null;
  totaux: Totaux;
}

export interface ContratSousTraitantDetail extends ContratSousTraitantSummary {
  tauxTva: string;
  lignes: LigneContratSousTraitant[];
  sousTraitant: { id: string; nom: string; ice: string | null; adresse: string | null; ville: string | null };
}
