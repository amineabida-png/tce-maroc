import type { Totaux } from '@/lib/money';

export type StatutDevis = 'BROUILLON' | 'ENVOYE' | 'ACCEPTE' | 'REFUSE' | 'EXPIRE' | 'CONVERTI';

export const STATUT_DEVIS_LABELS: Record<StatutDevis, string> = {
  BROUILLON: 'Brouillon',
  ENVOYE: 'Envoyé',
  ACCEPTE: 'Accepté',
  REFUSE: 'Refusé',
  EXPIRE: 'Expiré',
  CONVERTI: 'Converti en commande',
};

export const STATUT_DEVIS_VARIANT: Record<StatutDevis, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  BROUILLON: 'outline',
  ENVOYE: 'secondary',
  ACCEPTE: 'default',
  REFUSE: 'destructive',
  EXPIRE: 'destructive',
  CONVERTI: 'default',
};

export const STATUTS_MODIFIABLES: StatutDevis[] = ['BROUILLON', 'ENVOYE'];

export interface LigneDevis {
  id: string;
  designation: string;
  unite: string;
  quantite: string;
  prixUnitaire: string;
  ordre: number;
}

export interface LotDevis {
  id: string;
  nom: string;
  ordre: number;
  lignes: LigneDevis[];
}

export interface DevisSummary {
  id: string;
  numero: string;
  statut: StatutDevis;
  date: string;
  dateValidite: string | null;
  client: { id: string; nom: string };
  chantier: { id: string; nom: string } | null;
  totaux: Totaux;
}

export interface Devis extends DevisSummary {
  tauxTva: string;
  conditions: string | null;
  lots: LotDevis[];
  lignesSansLot: LigneDevis[];
}
