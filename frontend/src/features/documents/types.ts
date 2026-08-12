export type TypeEntiteDocument =
  | 'CHANTIER'
  | 'CLIENT'
  | 'FOURNISSEUR'
  | 'SOUS_TRAITANT'
  | 'DEVIS'
  | 'COMMANDE'
  | 'FACTURE'
  | 'COMMANDE_FOURNISSEUR';

export interface DocumentMetadonnees {
  id: string;
  nom: string;
  typeMime: string;
  tailleOctets: number;
  entiteType: TypeEntiteDocument;
  entiteId: string;
  createdAt: string;
  uploadedPar: { id: string; nom: string; prenom: string } | null;
}
