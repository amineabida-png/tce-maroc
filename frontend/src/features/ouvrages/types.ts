export interface Ouvrage {
  id: string;
  corpsDetat: string;
  designation: string;
  unite: string;
  prixUnitaireDefaut: string;
  actif: boolean;
}

export const UNITES_SUGGESTIONS = ['m²', 'ml', 'm³', 'u', 'forfait', 'kg', 'h'];
