import { z } from 'zod';

export const statutContratSousTraitantEnum = z.enum(['BROUILLON', 'CONFIRME', 'TERMINE', 'ANNULE']);

const ligneInputSchema = z.object({
  designation: z.string().min(1, 'Désignation obligatoire').max(300),
  unite: z.string().min(1, 'Unité obligatoire').max(20),
  quantite: z.number().positive('La quantité doit être positive'),
  prixUnitaire: z.number().min(0, 'Le prix doit être positif ou nul'),
});
export type LigneInput = z.infer<typeof ligneInputSchema>;

export const contratSousTraitantContentSchema = z.object({
  sousTraitantId: z.string().uuid('Sous-traitant invalide'),
  chantierId: z.string().uuid().nullish().or(z.literal('')),
  tauxTva: z.number().min(0).max(100).optional(),
  lignes: z.array(ligneInputSchema).default([]),
});
export type ContratSousTraitantContentInput = z.infer<typeof contratSousTraitantContentSchema>;

export const changeStatutSchema = z.object({
  statut: statutContratSousTraitantEnum,
});
