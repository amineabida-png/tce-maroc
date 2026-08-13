import type { Totaux } from '@/lib/money';

export type StatutFacture = 'BROUILLON' | 'ENVOYEE' | 'PARTIELLEMENT_PAYEE' | 'PAYEE' | 'EN_RETARD' | 'ANNULEE';
export type TypeFacture = 'FACTURE' | 'AVOIR';

export const STATUT_FACTURE_LABELS: Record<StatutFacture, string> = {
  BROUILLON: 'Brouillon',
  ENVOYEE: 'Envoyée',
  PARTIELLEMENT_PAYEE: 'Partiellement payée',
  PAYEE: 'Payée',
  EN_RETARD: 'En retard',
  ANNULEE: 'Annulée',
};

export const STATUT_FACTURE_VARIANT: Record<StatutFacture, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  BROUILLON: 'outline',
  ENVOYEE: 'secondary',
  PARTIELLEMENT_PAYEE: 'secondary',
  PAYEE: 'default',
  EN_RETARD: 'destructive',
  ANNULEE: 'destructive',
};

export const STATUTS_MODIFIABLES: StatutFacture[] = ['BROUILLON'];

export interface LigneFacture {
  id: string;
  designation: string;
  unite: string;
  quantite: string;
  prixUnitaire: string;
  ordre: number;
}

export interface Paiement {
  id: string;
  montant: string;
  date: string;
  mode: string | null;
  reference: string | null;
}

export interface FactureSummary {
  id: string;
  numero: string;
  type: TypeFacture;
  statut: StatutFacture;
  date: string;
  dateEcheance: string | null;
  client: { id: string; nom: string };
  chantier: { id: string; nom: string } | null;
  totaux: Totaux;
  montantPaye: number;
  montantRestantDu: number;
  enRetard: boolean;
}

export interface Facture extends FactureSummary {
  tauxTva: string;
  tauxRetenueGarantie: string;
  devis: { id: string; numero: string } | null;
  commande: { id: string; numero: string } | null;
  lignes: LigneFacture[];
  paiements: Paiement[];
  client: { id: string; nom: string; ice: string | null; adresse: string | null; ville: string | null };
}
