import { z } from 'zod';

export const typeFactureEnum = z.enum(['FACTURE', 'AVOIR']);

const ligneInputSchema = z.object({
  designation: z.string().min(1, 'Désignation obligatoire').max(300),
  unite: z.string().min(1, 'Unité obligatoire').max(20),
  quantite: z.number().positive('La quantité doit être positive'),
  prixUnitaire: z.number().min(0, 'Le prix doit être positif ou nul'),
});

export const factureContentSchema = z.object({
  type: typeFactureEnum.optional(),
  clientId: z.string().uuid('Client invalide'),
  chantierId: z.string().uuid().nullish().or(z.literal('')),
  dateEcheance: z.string().nullish().or(z.literal('')),
  tauxTva: z.number().min(0).max(100).optional(),
  tauxRetenueGarantie: z.number().min(0).max(100).optional(),
  lignes: z.array(ligneInputSchema).default([]),
});
export type FactureContentInput = z.infer<typeof factureContentSchema>;

export const createPaiementSchema = z.object({
  montant: z.number().positive('Le montant doit être positif'),
  date: z.string().min(1, 'La date est obligatoire'),
  mode: z.string().max(50).nullish(),
  reference: z.string().max(100).nullish(),
});
export type CreatePaiementInput = z.infer<typeof createPaiementSchema>;
