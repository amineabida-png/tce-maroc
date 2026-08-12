export type TypeClient = 'PARTICULIER' | 'ENTREPRISE' | 'MAITRE_OUVRAGE_PUBLIC';

export interface Client {
  id: string;
  type: TypeClient;
  nom: string;
  contactNom: string | null;
  ice: string | null;
  rc: string | null;
  identifiantFiscal: string | null;
  adresse: string | null;
  ville: string | null;
  telephone: string | null;
  email: string | null;
  notes: string | null;
  actif: boolean;
  createdAt: string;
  updatedAt: string;
}

export const TYPE_CLIENT_LABELS: Record<TypeClient, string> = {
  PARTICULIER: 'Particulier',
  ENTREPRISE: 'Entreprise',
  MAITRE_OUVRAGE_PUBLIC: "Maître d'ouvrage public",
};
