import { z } from 'zod';

export const statutDevisEnum = z.enum(['BROUILLON', 'ENVOYE', 'ACCEPTE', 'REFUSE', 'EXPIRE', 'CONVERTI']);

const ligneInputSchema = z.object({
  designation: z.string().min(1, 'Désignation obligatoire').max(300),
  unite: z.string().min(1, 'Unité obligatoire').max(20),
  quantite: z.number().positive('La quantité doit être positive'),
  prixUnitaire: z.number().min(0, 'Le prix doit être positif ou nul'),
});
export type LigneInput = z.infer<typeof ligneInputSchema>;

const lotInputSchema = z.object({
  nom: z.string().min(1, 'Nom de lot obligatoire').max(150),
  lignes: z.array(ligneInputSchema).default([]),
});

// Le devis est édité comme un tout (lots + lignes envoyés au complet à
// chaque sauvegarde) plutôt que via un diff ligne par ligne — plus simple
// et fiable pour un éditeur de type tableur côté frontend.
export const devisContentSchema = z.object({
  clientId: z.string().uuid('Client invalide'),
  chantierId: z.string().uuid().nullish().or(z.literal('')),
  dateValidite: z.string().nullish().or(z.literal('')),
  tauxTva: z.number().min(0).max(100).optional(),
  conditions: z.string().max(2000).nullish(),
  lots: z.array(lotInputSchema).default([]),
  lignesSansLot: z.array(ligneInputSchema).default([]),
});
export type DevisContentInput = z.infer<typeof devisContentSchema>;

export const changeStatutSchema = z.object({
  statut: statutDevisEnum,
});
