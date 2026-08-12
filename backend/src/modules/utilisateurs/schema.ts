import { z } from 'zod';

export const roleEnum = z.enum(['ADMIN', 'DIRECTEUR', 'CONDUCTEUR_TRAVAUX', 'COMPTABLE', 'MAGASINIER', 'COMMERCIAL']);

export const createUtilisateurSchema = z.object({
  email: z.string().email('Email invalide'),
  motDePasse: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
  nom: z.string().min(1, 'Le nom est obligatoire').max(100),
  prenom: z.string().min(1, 'Le prénom est obligatoire').max(100),
  role: roleEnum,
});
export type CreateUtilisateurInput = z.infer<typeof createUtilisateurSchema>;

export const updateUtilisateurSchema = z.object({
  email: z.string().email('Email invalide').optional(),
  nom: z.string().min(1).max(100).optional(),
  prenom: z.string().min(1).max(100).optional(),
  role: roleEnum.optional(),
});
export type UpdateUtilisateurInput = z.infer<typeof updateUtilisateurSchema>;

export const reinitialiserMotDePasseSchema = z.object({
  nouveauMotDePasse: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
});
export type ReinitialiserMotDePasseInput = z.infer<typeof reinitialiserMotDePasseSchema>;
