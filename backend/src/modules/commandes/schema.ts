import { z } from 'zod';

export const statutCommandeEnum = z.enum(['BROUILLON', 'CONFIRMEE', 'ANNULEE', 'FACTUREE']);

const ligneInputSchema = z.object({
  designation: z.string().min(1, 'Désignation obligatoire').max(300),
  unite: z.string().min(1, 'Unité obligatoire').max(20),
  quantite: z.number().positive('La quantité doit être positive'),
  prixUnitaire: z.number().min(0, 'Le prix doit être positif ou nul'),
});

export const commandeContentSchema = z.object({
  clientId: z.string().uuid('Client invalide'),
  chantierId: z.string().uuid().nullish().or(z.literal('')),
  tauxTva: z.number().min(0).max(100).optional(),
  lignes: z.array(ligneInputSchema).default([]),
});
export type CommandeContentInput = z.infer<typeof commandeContentSchema>;

export const changeStatutCommandeSchema = z.object({
  statut: statutCommandeEnum,
});
