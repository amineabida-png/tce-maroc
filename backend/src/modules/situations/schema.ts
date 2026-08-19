import { z } from 'zod';

export const statutSituationEnum = z.enum(['BROUILLON', 'ENVOYEE', 'PAYEE', 'ANNULEE']);

const ligneInputSchema = z.object({
  designation: z.string().min(1, 'Désignation obligatoire').max(300),
  unite: z.string().min(1, 'Unité obligatoire').max(20),
  quantiteMarche: z.number().positive('La quantité doit être positive'),
  prixUnitaire: z.number().min(0, 'Le prix doit être positif ou nul'),
  // Avancement cumulé À CE JOUR (pas le delta) — le serveur calcule le
  // précédent à partir de la dernière situation du même marché et en
  // déduit le delta facturé sur cette situation.
  avancementCumulePourcent: z.number().min(0, 'Doit être positif ou nul').max(100, 'Ne peut pas dépasser 100%'),
});
export type LigneInput = z.infer<typeof ligneInputSchema>;

export const situationContentSchema = z
  .object({
    commandeId: z.string().uuid().nullish().or(z.literal('')),
    contratSousTraitantId: z.string().uuid().nullish().or(z.literal('')),
    chantierId: z.string().uuid().nullish().or(z.literal('')),
    tauxTva: z.number().min(0).max(100).optional(),
    tauxRetenueGarantie: z.number().min(0).max(100).optional(),
    lignes: z.array(ligneInputSchema).default([]),
  })
  .refine((data) => Boolean(data.commandeId) !== Boolean(data.contratSousTraitantId), {
    message: 'La situation doit être liée à exactement un marché (une commande client OU un contrat de sous-traitance).',
    path: ['commandeId'],
  });
export type SituationContentInput = z.infer<typeof situationContentSchema>;

export const changeStatutSchema = z.object({
  statut: statutSituationEnum,
});
