import { z } from 'zod';

export const typeContratEnum = z.enum(['CDI', 'CDD', 'JOURNALIER', 'AUTRE']);

export const createEmployeSchema = z.object({
  nom: z.string().min(1, 'Le nom est obligatoire').max(150),
  prenom: z.string().min(1, 'Le prénom est obligatoire').max(150),
  cin: z.string().max(30).nullish(),
  cnss: z.string().max(30).nullish(),
  poste: z.string().max(150).nullish(),
  typeContrat: typeContratEnum.default('CDI'),
  dateEmbauche: z.string().nullish().or(z.literal('')),
  tauxHoraire: z.number().min(0).nullish(),
  telephone: z.string().max(30).nullish(),
  email: z.string().email().nullish().or(z.literal('')),
  adresse: z.string().max(300).nullish(),
  notes: z.string().max(2000).nullish(),
});
export type CreateEmployeInput = z.infer<typeof createEmployeSchema>;

export const updateEmployeSchema = createEmployeSchema.partial().extend({
  actif: z.boolean().optional(),
});
export type UpdateEmployeInput = z.infer<typeof updateEmployeSchema>;
