import type { Totaux } from '@/lib/money';

export type StatutCommande = 'BROUILLON' | 'CONFIRMEE' | 'ANNULEE' | 'FACTUREE';

export const STATUT_COMMANDE_LABELS: Record<StatutCommande, string> = {
  BROUILLON: 'Brouillon',
  CONFIRMEE: 'Confirmée',
  ANNULEE: 'Annulée',
  FACTUREE: 'Facturée',
};

export const STATUT_COMMANDE_VARIANT: Record<StatutCommande, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  BROUILLON: 'outline',
  CONFIRMEE: 'default',
  ANNULEE: 'destructive',
  FACTUREE: 'secondary',
};

export const STATUTS_MODIFIABLES: StatutCommande[] = ['BROUILLON'];

export interface LigneCommande {
  id: string;
  designation: string;
  unite: string;
  quantite: string;
  prixUnitaire: string;
  ordre: number;
}

export interface CommandeSummary {
  id: string;
  numero: string;
  statut: StatutCommande;
  date: string;
  client: { id: string; nom: string };
  chantier: { id: string; nom: string } | null;
  totaux: Totaux;
}

export interface Commande extends CommandeSummary {
  tauxTva: string;
  devis: { id: string; numero: string } | null;
  lignes: LigneCommande[];
  client: { id: string; nom: string; ice: string | null; adresse: string | null; ville: string | null };
}
