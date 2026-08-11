// Client Prisma en singleton — évite d'ouvrir un nouveau pool de connexions
// à chaque import (problème classique avec le hot-reload en dev).
import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma = global.__prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}
