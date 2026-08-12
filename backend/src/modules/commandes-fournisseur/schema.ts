import { z } from 'zod';

export const statutCommandeFournisseurEnum = z.enum(['BROUILLON', 'ENVOYEE', 'PARTIELLEMENT_RECUE', 'RECUE', 'ANNULEE']);

const ligneInputSchema = z.object({
  articleId: z.string().uuid().nullish().or(z.literal('')),
  designation: z.string().min(1, 'Désignation obligatoire').max(300),
  unite: z.string().min(1, 'Unité obligatoire').max(20),
  quantiteCommandee: z.number().positive('La quantité doit être positive'),
  prixUnitaire: z.number().min(0, 'Le prix doit être positif ou nul'),
});

export const commandeFournisseurContentSchema = z.object({
  fournisseurId: z.string().uuid('Fournisseur invalide'),
  chantierId: z.string().uuid().nullish().or(z.literal('')),
  tauxTva: z.number().min(0).max(100).optional(),
  lignes: z.array(ligneInputSchema).default([]),
});
export type CommandeFournisseurContentInput = z.infer<typeof commandeFournisseurContentSchema>;

export const changeStatutSchema = z.object({
  statut: statutCommandeFournisseurEnum,
});

export const receptionSchema = z.object({
  lignes: z
    .array(
      z.object({
        ligneId: z.string().uuid(),
        quantiteRecue: z.number().min(0),
      })
    )
    .min(1, 'Au moins une ligne à réceptionner'),
});
export type ReceptionInput = z.infer<typeof receptionSchema>;
