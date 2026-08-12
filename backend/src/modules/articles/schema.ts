import { z } from 'zod';

export const createArticleSchema = z.object({
  nom: z.string().min(1, 'Le nom est obligatoire').max(200),
  categorie: z.string().max(100).nullish(),
  unite: z.string().min(1, "L'unité est obligatoire").max(20),
  seuilAlerte: z.number().min(0).nullish(),
});
export type CreateArticleInput = z.infer<typeof createArticleSchema>;

export const updateArticleSchema = createArticleSchema.partial().extend({
  actif: z.boolean().optional(),
});
export type UpdateArticleInput = z.infer<typeof updateArticleSchema>;
