import { prisma } from '../../db/client';
import { AppError } from '../../middleware/errorHandler';
import { hashPassword } from '../../lib/password';
import type { CreateUtilisateurInput, UpdateUtilisateurInput } from './schema';

const SELECT_PUBLIC = { id: true, nom: true, prenom: true, role: true, email: true, actif: true, createdAt: true } as const;

// Liste utilisée à la fois par les sélecteurs légers (ex. conducteur de
// travaux d'un chantier — actif uniquement, pas de recherche) et par la
// page Administration (recherche, comptes désactivés inclus sur demande) :
// même endpoint, champs supplémentaires toujours renvoyés (non filtrants
// tant qu'ils ne sont pas consommés), pas de divergence de forme de
// réponse entre les deux usages.
export async function listUtilisateurs(filters: { role?: string; q?: string; includeInactifs?: boolean }) {
  return prisma.utilisateur.findMany({
    where: {
      ...(filters.includeInactifs ? {} : { actif: true }),
      ...(filters.role ? { role: filters.role as never } : {}),
      ...(filters.q
        ? {
            OR: [
              { nom: { contains: filters.q, mode: 'insensitive' } },
              { prenom: { contains: filters.q, mode: 'insensitive' } },
              { email: { contains: filters.q, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    select: SELECT_PUBLIC,
    orderBy: { prenom: 'asc' },
  });
}

async function fetchUtilisateurOrThrow(id: string) {
  const utilisateur = await prisma.utilisateur.findUnique({ where: { id } });
  if (!utilisateur) throw new AppError(404, 'Utilisateur introuvable.');
  return utilisateur;
}

export async function createUtilisateur(data: CreateUtilisateurInput) {
  const existant = await prisma.utilisateur.findUnique({ where: { email: data.email } });
  if (existant) throw new AppError(409, 'Un compte existe déjà avec cet email.');

  const motDePasse = await hashPassword(data.motDePasse);
  return prisma.utilisateur.create({
    data: { email: data.email, motDePasse, nom: data.nom, prenom: data.prenom, role: data.role },
    select: SELECT_PUBLIC,
  });
}

export async function updateUtilisateur(id: string, data: UpdateUtilisateurInput) {
  await fetchUtilisateurOrThrow(id);
  if (data.email) {
    const existant = await prisma.utilisateur.findUnique({ where: { email: data.email } });
    if (existant && existant.id !== id) throw new AppError(409, 'Un compte existe déjà avec cet email.');
  }
  return prisma.utilisateur.update({ where: { id }, data, select: SELECT_PUBLIC });
}

export async function deactivateUtilisateur(id: string, demandeurId: string) {
  if (id === demandeurId) throw new AppError(409, 'Vous ne pouvez pas désactiver votre propre compte.');
  await fetchUtilisateurOrThrow(id);
  return prisma.utilisateur.update({ where: { id }, data: { actif: false }, select: SELECT_PUBLIC });
}

export async function reactivateUtilisateur(id: string) {
  await fetchUtilisateurOrThrow(id);
  return prisma.utilisateur.update({ where: { id }, data: { actif: true }, select: SELECT_PUBLIC });
}

export async function reinitialiserMotDePasse(id: string, nouveauMotDePasse: string) {
  await fetchUtilisateurOrThrow(id);
  const motDePasse = await hashPassword(nouveauMotDePasse);
  // Toute réinitialisation de mot de passe révoque les sessions existantes
  // de ce compte — évite qu'un accès déjà compromis reste valide après coup.
  await prisma.$transaction([
    prisma.utilisateur.update({ where: { id }, data: { motDePasse } }),
    prisma.refreshToken.updateMany({ where: { utilisateurId: id, revokedAt: null }, data: { revokedAt: new Date() } }),
  ]);
}
