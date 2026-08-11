import { randomUUID } from 'node:crypto';
import { prisma } from '../../db/client';
import { AppError } from '../../middleware/errorHandler';
import { logAudit } from '../../lib/audit';
import { verifyPassword } from '../../lib/password';
import {
  refreshExpiryDate,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../../lib/jwt';

interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: { id: string; email: string; nom: string; prenom: string; role: string };
}

function toPublicUser(u: { id: string; email: string; nom: string; prenom: string; role: string }) {
  return { id: u.id, email: u.email, nom: u.nom, prenom: u.prenom, role: u.role };
}

async function issueTokens(userId: string, role: string): Promise<{ accessToken: string; refreshToken: string }> {
  const jti = randomUUID();
  const refreshToken = signRefreshToken({ sub: userId, jti });
  await prisma.refreshToken.create({
    data: { token: refreshToken, utilisateurId: userId, expiresAt: refreshExpiryDate() },
  });
  const accessToken = signAccessToken({ sub: userId, role });
  return { accessToken, refreshToken };
}

export async function login(email: string, motDePasse: string): Promise<AuthResult> {
  const user = await prisma.utilisateur.findUnique({ where: { email } });
  // Message volontairement identique que ce soit le compte ou le mot de
  // passe qui soit incorrect : ne pas laisser deviner quels emails existent.
  if (!user || !user.actif) throw new AppError(401, 'Email ou mot de passe incorrect.');
  const valid = await verifyPassword(motDePasse, user.motDePasse);
  if (!valid) throw new AppError(401, 'Email ou mot de passe incorrect.');

  const tokens = await issueTokens(user.id, user.role);
  await logAudit({ utilisateurId: user.id, action: 'LOGIN' });
  return { ...tokens, user: toPublicUser(user) };
}

export async function refresh(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError(401, 'Session expirée — reconnectez-vous.');
  }

  const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    throw new AppError(401, 'Session expirée — reconnectez-vous.');
  }

  const user = await prisma.utilisateur.findUnique({ where: { id: payload.sub } });
  if (!user || !user.actif) throw new AppError(401, 'Session expirée — reconnectez-vous.');

  // Rotation : l'ancien jeton est révoqué dès qu'un nouveau est émis, pour
  // qu'un jeton volé et rejoué après coup soit détectable/invalide.
  await prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });
  return issueTokens(user.id, user.role);
}

export async function logout(refreshToken: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { token: refreshToken, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
