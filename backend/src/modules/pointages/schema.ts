import { z } from 'zod';

export const statutPointageEnum = z.enum(['PRESENT', 'ABSENT', 'CONGE', 'MALADIE', 'JOUR_FERIE']);

export const upsertPointageSchema = z.object({
  employeId: z.string().uuid('Employé invalide'),
  chantierId: z.string().uuid().nullish().or(z.literal('')),
  date: z.string().min(1, 'La date est obligatoire'),
  statut: statutPointageEnum.default('PRESENT'),
  nombreHeures: z.number().min(0).max(24).nullish(),
  notes: z.string().max(500).nullish(),
});
export type UpsertPointageInput = z.infer<typeof upsertPointageSchema>;
