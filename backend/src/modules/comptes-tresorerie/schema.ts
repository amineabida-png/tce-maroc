import { z } from 'zod';

export const typeCompteEnum = z.enum(['BANQUE', 'CAISSE']);

export const createCompteSchema = z.object({
  nom: z.string().min(1, 'Le nom est obligatoire').max(150),
  type: typeCompteEnum.default('BANQUE'),
  banque: z.string().max(150).nullish(),
  rib: z.string().max(50).nullish(),
  soldeInitial: z.number().default(0),
});
export type CreateCompteInput = z.infer<typeof createCompteSchema>;

export const updateCompteSchema = createCompteSchema.partial();
export type UpdateCompteInput = z.infer<typeof updateCompteSchema>;
