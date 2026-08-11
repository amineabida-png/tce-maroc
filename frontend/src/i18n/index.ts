import { fr } from './dictionaries/fr';

// Un seul point d'entrée pour les traductions : aujourd'hui figé sur 'fr',
// mais toute la couche UI importe `t` d'ici plutôt que le dictionnaire
// français directement — le jour où l'arabe est ajouté, seul ce fichier
// change (résolution de la langue active), pas les composants.
export const t = fr;
export type { Dictionary } from './dictionaries/fr';
