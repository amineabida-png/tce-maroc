import { z } from 'zod';

export const sensMouvementEnum = z.enum(['ENCAISSEMENT', 'DECAISSEMENT']);
export const statutMouvementEnum = z.enum(['PREVU', 'REALISE']);
export const modePaiementEnum = z.enum(['ESPECES', 'CHEQUE', 'VIREMENT', 'EFFET', 'AUTRE']);

export const createMouvementSchema = z.object({
  compteId: z.string().uuid('Compte invalide'),
  sens: sensMouvementEnum,
  statut: statutMouvementEnum.default('REALISE'),
  montant: z.number().positive('Le montant doit être positif'),
  date: z.string().min(1, 'La date est obligatoire'),
  modePaiement: modePaiementEnum.default('VIREMENT'),
  reference: z.string().max(100).nullish(),
  description: z.string().max(500).nullish(),
  chantierId: z.string().uuid().nullish().or(z.literal('')),
  fournisseurId: z.string().uuid().nullish().or(z.literal('')),
  sousTraitantId: z.string().uuid().nullish().or(z.literal('')),
});
export type CreateMouvementInput = z.infer<typeof createMouvementSchema>;

export const updateMouvementSchema = createMouvementSchema.partial();
export type UpdateMouvementInput = z.infer<typeof updateMouvementSchema>;

export const rapprocherSchema = z.object({
  rapproche: z.boolean(),
});
export type RapprocherInput = z.infer<typeof rapprocherSchema>;
