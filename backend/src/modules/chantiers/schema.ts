import { z } from 'zod';

export const statutChantierEnum = z.enum(['EN_PREPARATION', 'EN_COURS', 'EN_RETARD', 'SUSPENDU', 'TERMINE', 'ANNULE']);
export const statutTacheEnum = z.enum(['A_FAIRE', 'EN_COURS', 'TERMINEE', 'BLOQUEE']);
export const categorieDepenseEnum = z.enum(['MAIN_DOEUVRE', 'MATERIAUX', 'SOUS_TRAITANCE', 'LOCATION_MATERIEL', 'AUTRE']);

// Dates : chaînes 'YYYY-MM-DD' (input HTML natif) ou vide/absent.
const dateInput = z.string().nullish().or(z.literal(''));

export const createChantierSchema = z.object({
  nom: z.string().min(1, 'Le nom est obligatoire').max(200),
  clientId: z.string().uuid().nullish().or(z.literal('')),
  adresse: z.string().max(300).nullish(),
  ville: z.string().max(100).nullish(),
  budgetPrevisionnel: z.number().min(0).nullish(),
  dateDebut: dateInput,
  dateFinPrevue: dateInput,
  dateFinReelle: dateInput,
  avancement: z.number().int().min(0).max(100).optional(),
  statut: statutChantierEnum.optional(),
  conducteurId: z.string().uuid().nullish().or(z.literal('')),
  description: z.string().max(2000).nullish(),
});
export type CreateChantierInput = z.infer<typeof createChantierSchema>;

export const updateChantierSchema = createChantierSchema.partial().extend({
  actif: z.boolean().optional(),
});
export type UpdateChantierInput = z.infer<typeof updateChantierSchema>;

export const createTacheSchema = z.object({
  nom: z.string().min(1, 'Le nom est obligatoire').max(200),
  dateDebut: dateInput,
  dateFin: dateInput,
  avancement: z.number().int().min(0).max(100).optional(),
  statut: statutTacheEnum.optional(),
  ordre: z.number().int().optional(),
  predecesseurId: z.string().uuid().nullish().or(z.literal('')),
});
export type CreateTacheInput = z.infer<typeof createTacheSchema>;

export const updateTacheSchema = createTacheSchema.partial();
export type UpdateTacheInput = z.infer<typeof updateTacheSchema>;

export const createDepenseSchema = z.object({
  categorie: categorieDepenseEnum,
  montant: z.number().positive('Le montant doit être positif'),
  date: z.string().min(1, 'La date est obligatoire'),
  description: z.string().max(500).nullish(),
  fournisseurId: z.string().uuid().nullish().or(z.literal('')),
  sousTraitantId: z.string().uuid().nullish().or(z.literal('')),
});
export type CreateDepenseInput = z.infer<typeof createDepenseSchema>;
