import { z } from 'zod';

const ligneInputSchema = z.object({
  designation: z.string().min(1, 'Désignation obligatoire').max(300),
  unite: z.string().min(1, 'Unité obligatoire').max(20),
  quantiteCommandee: z.number().min(0).nullish(),
  quantiteLivree: z.number().min(0, 'La quantité livrée doit être positive ou nulle'),
  observations: z.string().max(300).nullish(),
});
export type LigneInput = z.infer<typeof ligneInputSchema>;

// Comme les autres documents : contenu envoyé au complet à chaque
// sauvegarde plutôt qu'en diff ligne par ligne.
export const bonLivraisonContentSchema = z.object({
  clientId: z.string().uuid('Client invalide'),
  chantierId: z.string().uuid().nullish().or(z.literal('')),
  commandeId: z.string().uuid().nullish().or(z.literal('')),
  lieuLivraison: z.string().max(300).nullish(),
  notes: z.string().max(1000).nullish(),
  lignes: z.array(ligneInputSchema).default([]),
});
export type BonLivraisonContentInput = z.infer<typeof bonLivraisonContentSchema>;
