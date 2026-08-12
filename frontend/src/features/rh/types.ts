export type TypeContrat = 'CDI' | 'CDD' | 'JOURNALIER' | 'AUTRE';

export const TYPE_CONTRAT_LABELS: Record<TypeContrat, string> = {
  CDI: 'CDI',
  CDD: 'CDD',
  JOURNALIER: 'Journalier',
  AUTRE: 'Autre',
};

export interface Employe {
  id: string;
  nom: string;
  prenom: string;
  cin: string | null;
  cnss: string | null;
  poste: string | null;
  typeContrat: TypeContrat;
  dateEmbauche: string | null;
  tauxHoraire: string | null;
  telephone: string | null;
  email: string | null;
  adresse: string | null;
  notes: string | null;
  actif: boolean;
}

export type StatutPointage = 'PRESENT' | 'ABSENT' | 'CONGE' | 'MALADIE' | 'JOUR_FERIE';

export const STATUT_POINTAGE_LABELS: Record<StatutPointage, string> = {
  PRESENT: 'Présent',
  ABSENT: 'Absent',
  CONGE: 'Congé',
  MALADIE: 'Maladie',
  JOUR_FERIE: 'Jour férié',
};

export const STATUT_POINTAGE_VARIANT: Record<StatutPointage, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  PRESENT: 'default',
  ABSENT: 'destructive',
  CONGE: 'secondary',
  MALADIE: 'secondary',
  JOUR_FERIE: 'outline',
};

export interface Pointage {
  id: string;
  employeId: string;
  employe: { id: string; nom: string; prenom: string };
  chantierId: string | null;
  chantier: { id: string; nom: string } | null;
  date: string;
  statut: StatutPointage;
  nombreHeures: string | null;
  notes: string | null;
}

export interface CoutParEmploye {
  employeId: string;
  nom: string;
  prenom: string;
  heures: number;
  cout: number;
}

export interface CoutMainDoeuvre {
  totalHeures: number;
  totalCout: number;
  parEmploye: CoutParEmploye[];
}
