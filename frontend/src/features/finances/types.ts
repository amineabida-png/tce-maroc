export type TypeCompte = 'BANQUE' | 'CAISSE';

export const TYPE_COMPTE_LABELS: Record<TypeCompte, string> = {
  BANQUE: 'Banque',
  CAISSE: 'Caisse',
};

export interface CompteTresorerie {
  id: string;
  nom: string;
  type: TypeCompte;
  banque: string | null;
  rib: string | null;
  soldeInitial: string;
  actif: boolean;
  solde: number;
}

export type SensMouvement = 'ENCAISSEMENT' | 'DECAISSEMENT';
export type StatutMouvement = 'PREVU' | 'REALISE';
export type ModePaiementTresorerie = 'ESPECES' | 'CHEQUE' | 'VIREMENT' | 'EFFET' | 'AUTRE';

export const SENS_LABELS: Record<SensMouvement, string> = {
  ENCAISSEMENT: 'Encaissement',
  DECAISSEMENT: 'Décaissement',
};

export const STATUT_MOUVEMENT_LABELS: Record<StatutMouvement, string> = {
  PREVU: 'Prévu',
  REALISE: 'Réalisé',
};

export const MODE_PAIEMENT_LABELS: Record<ModePaiementTresorerie, string> = {
  ESPECES: 'Espèces',
  CHEQUE: 'Chèque',
  VIREMENT: 'Virement',
  EFFET: 'Effet',
  AUTRE: 'Autre',
};

export interface MouvementTresorerie {
  id: string;
  compteId: string;
  compte: { id: string; nom: string; type: TypeCompte };
  sens: SensMouvement;
  statut: StatutMouvement;
  montant: string;
  date: string;
  modePaiement: ModePaiementTresorerie;
  reference: string | null;
  description: string | null;
  chantierId: string | null;
  chantier: { id: string; nom: string } | null;
  fournisseurId: string | null;
  fournisseur: { id: string; nom: string } | null;
  sousTraitantId: string | null;
  sousTraitant: { id: string; nom: string } | null;
  rapproche: boolean;
  dateRapprochement: string | null;
}

export interface JournalEntry {
  id: string;
  source: 'PAIEMENT_CLIENT' | 'MOUVEMENT';
  sens: SensMouvement;
  compteId: string;
  montant: number;
  date: string;
  modePaiement: string | null;
  reference: string | null;
  description: string;
  rapproche: boolean | null;
}

export interface EncaissementPrevu {
  id: string;
  numero: string;
  client: string;
  dateEcheance: string;
  montant: number;
  enRetard: boolean;
}

export interface Echeancier {
  encaissementsPrevus: EncaissementPrevu[];
  decaissementsPrevus: MouvementTresorerie[];
}
