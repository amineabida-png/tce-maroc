export interface Numerotation {
  id: string;
  typeDocument: string;
  prefixe: string;
  anneeCourante: number;
  dernierNumero: number;
  resetAnnuel: boolean;
}

export interface Societe {
  id: string;
  nom: string;
  formeJuridique: string | null;
  adresse: string | null;
  ville: string | null;
  telephone: string | null;
  email: string | null;
  logo: string | null;
  cachet: string | null;
  ice: string | null;
  rc: string | null;
  identifiantFiscal: string | null;
  patente: string | null;
  cnss: string | null;
  rib: string | null;
  tauxTvaDefaut: string;
  tauxRetenueGarantie: string;
  tauxRetenueSource: string;
  numerotations: Numerotation[];
}

export const TYPES_DOCUMENT_NUMEROTES = ['DEVIS', 'BON_COMMANDE', 'FACTURE', 'BON_COMMANDE_FOURNISSEUR', 'BON_LIVRAISON'] as const;

export const TYPE_DOCUMENT_LABELS: Record<string, string> = {
  DEVIS: 'Devis',
  BON_COMMANDE: 'Bon de commande',
  FACTURE: 'Facture',
  BON_COMMANDE_FOURNISSEUR: 'Bon de commande fournisseur',
  BON_LIVRAISON: 'Bon de livraison',
};

export const TYPE_DOCUMENT_PREFIXE_DEFAUT: Record<string, string> = {
  DEVIS: 'DEV',
  BON_COMMANDE: 'BC',
  FACTURE: 'FACT',
  BON_COMMANDE_FOURNISSEUR: 'BCF',
  BON_LIVRAISON: 'BL',
};
