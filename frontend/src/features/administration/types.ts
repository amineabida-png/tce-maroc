export type Role = 'ADMIN' | 'DIRECTEUR' | 'CONDUCTEUR_TRAVAUX' | 'COMPTABLE' | 'MAGASINIER' | 'COMMERCIAL';

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Administrateur',
  DIRECTEUR: 'Directeur',
  CONDUCTEUR_TRAVAUX: 'Conducteur de travaux',
  COMPTABLE: 'Comptable',
  MAGASINIER: 'Magasinier',
  COMMERCIAL: 'Commercial',
};

export interface Utilisateur {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  role: Role;
  actif: boolean;
  createdAt: string;
}

export interface JournalAuditEntry {
  id: string;
  action: string;
  entite: string | null;
  entiteId: string | null;
  metadonnees: Record<string, unknown> | null;
  createdAt: string;
  utilisateur: { id: string; nom: string; prenom: string } | null;
}
