export interface Fournisseur {
  id: string;
  nom: string;
  categorie: string | null;
  contactNom: string | null;
  ice: string | null;
  rc: string | null;
  identifiantFiscal: string | null;
  adresse: string | null;
  ville: string | null;
  telephone: string | null;
  email: string | null;
  evaluation: number | null;
  notes: string | null;
  actif: boolean;
  createdAt: string;
  updatedAt: string;
}
