import { z } from 'zod';

export const createSousTraitantSchema = z.object({
  nom: z.string().min(1, 'Le nom est obligatoire').max(200),
  corpsDetat: z.string().max(100).nullish(),
  contactNom: z.string().max(150).nullish(),
  ice: z.string().max(30).nullish(),
  rc: z.string().max(30).nullish(),
  identifiantFiscal: z.string().max(30).nullish(),
  adresse: z.string().max(300).nullish(),
  ville: z.string().max(100).nullish(),
  telephone: z.string().max(30).nullish(),
  email: z.string().email().nullish().or(z.literal('')),
  evaluation: z.number().int().min(1).max(5).nullish(),
  notes: z.string().max(2000).nullish(),
});
export type CreateSousTraitantInput = z.infer<typeof createSousTraitantSchema>;

export const updateSousTraitantSchema = createSousTraitantSchema.partial().extend({
  actif: z.boolean().optional(),
});
export type UpdateSousTraitantInput = z.infer<typeof updateSousTraitantSchema>;
