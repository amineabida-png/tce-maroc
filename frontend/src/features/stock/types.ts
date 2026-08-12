export type TypeMouvement = 'ENTREE' | 'SORTIE';

export interface Mouvement {
  id: string;
  type: TypeMouvement;
  quantite: string;
  prixUnitaire: string | null;
  date: string;
  notes: string | null;
  article: { id: string; nom: string; unite: string };
  chantier: { id: string; nom: string } | null;
}
