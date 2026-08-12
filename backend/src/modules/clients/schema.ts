import { z } from 'zod';

export const typeClientEnum = z.enum(['PARTICULIER', 'ENTREPRISE', 'MAITRE_OUVRAGE_PUBLIC']);

export const createClientSchema = z.object({
  type: typeClientEnum.default('ENTREPRISE'),
  nom: z.string().min(1, 'Le nom est obligatoire').max(200),
  contactNom: z.string().max(150).nullish(),
  ice: z.string().max(30).nullish(),
  rc: z.string().max(30).nullish(),
  identifiantFiscal: z.string().max(30).nullish(),
  adresse: z.string().max(300).nullish(),
  ville: z.string().max(100).nullish(),
  telephone: z.string().max(30).nullish(),
  email: z.string().email().nullish().or(z.literal('')),
  notes: z.string().max(2000).nullish(),
});
export type CreateClientInput = z.infer<typeof createClientSchema>;

export const updateClientSchema = createClientSchema.partial().extend({
  actif: z.boolean().optional(),
});
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
