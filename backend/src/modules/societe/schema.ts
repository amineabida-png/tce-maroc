import { z } from 'zod';

export const updateSocieteSchema = z.object({
  nom: z.string().min(1).max(200).optional(),
  formeJuridique: z.string().max(50).nullish(),
  adresse: z.string().max(300).nullish(),
  ville: z.string().max(100).nullish(),
  telephone: z.string().max(30).nullish(),
  email: z.string().email().nullish().or(z.literal('')),
  logo: z.string().nullish(),
  cachet: z.string().nullish(),

  ice: z.string().max(30).nullish(),
  rc: z.string().max(30).nullish(),
  identifiantFiscal: z.string().max(30).nullish(),
  patente: z.string().max(30).nullish(),
  cnss: z.string().max(30).nullish(),
  rib: z.string().max(40).nullish(),

  tauxTvaDefaut: z.number().min(0).max(100).optional(),
  tauxRetenueGarantie: z.number().min(0).max(100).optional(),
  tauxRetenueSource: z.number().min(0).max(100).optional(),
});
export type UpdateSocieteInput = z.infer<typeof updateSocieteSchema>;

export const upsertNumerotationSchema = z.object({
  typeDocument: z.string().min(1).max(40),
  // Rejette un préfixe purement numérique (ex. "2026") : erreur de saisie
  // fréquente en confondant ce champ avec l'année ou le numéro de départ,
  // qui se règlent ailleurs (l'année est automatique, le numéro de départ
  // via prochainNumero ci-dessous).
  prefixe: z
    .string()
    .min(1)
    .max(10)
    .refine((v) => /[A-Za-zÀ-ÿ]/.test(v), 'Le préfixe doit contenir au moins une lettre (ex. DEV, BC, FACT).'),
  resetAnnuel: z.boolean().optional(),
  // Prochain numéro à émettre (pas le dernier utilisé) — plus intuitif côté
  // formulaire ; converti en dernierNumero (valeur - 1) côté service.
  prochainNumero: z.number().int().min(1).optional(),
});
export type UpsertNumerotationInput = z.infer<typeof upsertNumerotationSchema>;
