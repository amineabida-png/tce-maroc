import { z } from 'zod';

export const createOuvrageSchema = z.object({
  corpsDetat: z.string().min(1, 'Le corps d\'état est obligatoire').max(100),
  designation: z.string().min(1, 'La désignation est obligatoire').max(300),
  unite: z.string().min(1, "L'unité est obligatoire").max(20),
  prixUnitaireDefaut: z.number().min(0, 'Le prix doit être positif ou nul'),
});
export type CreateOuvrageInput = z.infer<typeof createOuvrageSchema>;

export const updateOuvrageSchema = createOuvrageSchema.partial().extend({
  actif: z.boolean().optional(),
});
export type UpdateOuvrageInput = z.infer<typeof updateOuvrageSchema>;
