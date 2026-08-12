import { z } from 'zod';

// Les ENTREE ne se créent qu'via la réception d'une commande fournisseur
// (voir modules/commandes-fournisseur) — ce module ne gère que les SORTIE
// manuelles (consommation sur chantier), pour garder une source unique de
// vérité sur l'origine de chaque entrée en stock.
export const createSortieSchema = z.object({
  articleId: z.string().uuid('Article invalide'),
  quantite: z.number().positive('La quantité doit être positive'),
  chantierId: z.string().uuid().nullish().or(z.literal('')),
  date: z.string().nullish().or(z.literal('')),
  notes: z.string().max(500).nullish(),
});
export type CreateSortieInput = z.infer<typeof createSortieSchema>;
