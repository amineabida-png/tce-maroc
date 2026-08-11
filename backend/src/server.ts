import { env } from './config/env';
import { createApp } from './app';
import { prisma } from './db/client';

const app = createApp();

const server = app.listen(env.PORT, () => {
  console.log(`ERP TCE Maroc — API démarrée sur le port ${env.PORT} (${env.NODE_ENV})`);
});

async function shutdown(signal: string) {
  console.log(`${signal} reçu, arrêt propre...`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
