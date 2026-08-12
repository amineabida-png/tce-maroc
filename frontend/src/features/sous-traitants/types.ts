export interface SousTraitant {
  id: string;
  nom: string;
  corpsDetat: string | null;
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

// Corps d'état courants du BTP marocain, préremplis en suggestions — champ
// libre côté modèle pour ne pas figer la liste dans une migration.
export const CORPS_DETAT_SUGGESTIONS = [
  'Gros œuvre',
  'Électricité',
  'Plomberie',
  'Peinture',
  'Menuiserie',
  'Étanchéité',
  'Carrelage',
  'Faux-plafond',
  'Climatisation',
];
