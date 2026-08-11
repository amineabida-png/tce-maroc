// bcryptjs plutôt que bcrypt natif : évite toute compilation native au
// build (leçon tirée d'un précédent échec de build Railway avec un module
// natif équivalent sur un autre service du même projet).
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
