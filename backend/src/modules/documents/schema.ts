import { z } from 'zod';

export const typeEntiteDocumentEnum = z.enum([
  'CHANTIER',
  'CLIENT',
  'FOURNISSEUR',
  'SOUS_TRAITANT',
  'DEVIS',
  'COMMANDE',
  'FACTURE',
  'COMMANDE_FOURNISSEUR',
  'BON_LIVRAISON',
  'SITUATION',
  'CONTRAT_SOUS_TRAITANCE',
]);

// multer place le fichier dans req.file et les autres champs du
// multipart/form-data (chaînes uniquement) dans req.body — validés
// séparément du buffer binaire.
export const uploadDocumentSchema = z.object({
  entiteType: typeEntiteDocumentEnum,
  entiteId: z.string().uuid('Entité invalide'),
  nom: z.string().max(200).nullish(),
});
export type UploadDocumentInput = z.infer<typeof uploadDocumentSchema>;

export const listeDocumentsQuerySchema = z.object({
  entiteType: typeEntiteDocumentEnum,
  entiteId: z.string().uuid('Entité invalide'),
});
