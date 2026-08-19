import path from 'node:path';
import fs from 'node:fs';
import cors from 'cors';
import express, { type Express } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { env } from './config/env';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import authRoutes from './modules/auth/routes';
import societeRoutes from './modules/societe/routes';
import clientsRoutes from './modules/clients/routes';
import fournisseursRoutes from './modules/fournisseurs/routes';
import sousTraitantsRoutes from './modules/sous-traitants/routes';
import chantiersRoutes from './modules/chantiers/routes';
import utilisateursRoutes from './modules/utilisateurs/routes';
import ouvragesRoutes from './modules/ouvrages/routes';
import devisRoutes from './modules/devis/routes';
import commandesRoutes from './modules/commandes/routes';
import facturesRoutes from './modules/factures/routes';
import articlesRoutes from './modules/articles/routes';
import commandesFournisseurRoutes from './modules/commandes-fournisseur/routes';
import bonsLivraisonRoutes from './modules/bons-livraison/routes';
import contratsSousTraitanceRoutes from './modules/contrats-sous-traitance/routes';
import situationsRoutes from './modules/situations/routes';
import mouvementsStockRoutes from './modules/mouvements-stock/routes';
import employesRoutes from './modules/employes/routes';
import pointagesRoutes from './modules/pointages/routes';
import comptesTresorerieRoutes from './modules/comptes-tresorerie/routes';
import mouvementsTresorerieRoutes from './modules/mouvements-tresorerie/routes';
import reportingRoutes from './modules/reporting/routes';
import dashboardRoutes from './modules/dashboard/routes';
import administrationRoutes from './modules/administration/routes';
import documentsRoutes from './modules/documents/routes';

export function createApp(): Express {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.FRONTEND_URL ?? true,
      credentials: true,
    })
  );
  app.use(express.json({ limit: '5mb' }));

  // Limite globale, généreuse — la limite serrée spécifique au login vit
  // dans modules/auth/routes.ts.
  app.use(
    '/api',
    rateLimit({ windowMs: 60 * 1000, limit: 300, standardHeaders: true, legacyHeaders: false })
  );

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', env: env.NODE_ENV, timestamp: new Date().toISOString() });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/societe', societeRoutes);
  app.use('/api/clients', clientsRoutes);
  app.use('/api/fournisseurs', fournisseursRoutes);
  app.use('/api/sous-traitants', sousTraitantsRoutes);
  app.use('/api/chantiers', chantiersRoutes);
  app.use('/api/utilisateurs', utilisateursRoutes);
  app.use('/api/ouvrages', ouvragesRoutes);
  app.use('/api/devis', devisRoutes);
  app.use('/api/commandes', commandesRoutes);
  app.use('/api/factures', facturesRoutes);
  app.use('/api/articles', articlesRoutes);
  app.use('/api/commandes-fournisseur', commandesFournisseurRoutes);
  app.use('/api/bons-livraison', bonsLivraisonRoutes);
  app.use('/api/contrats-sous-traitance', contratsSousTraitanceRoutes);
  app.use('/api/situations', situationsRoutes);
  app.use('/api/mouvements-stock', mouvementsStockRoutes);
  app.use('/api/employes', employesRoutes);
  app.use('/api/pointages', pointagesRoutes);
  app.use('/api/comptes-tresorerie', comptesTresorerieRoutes);
  app.use('/api/mouvements-tresorerie', mouvementsTresorerieRoutes);
  app.use('/api/reporting', reportingRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/administration', administrationRoutes);
  app.use('/api/documents', documentsRoutes);

  // Le build sert le frontend statique compilé (une seule app Railway,
  // pas un service séparé par pièce du monorepo).
  const publicDir = path.join(__dirname, 'public');
  if (fs.existsSync(publicDir)) {
    app.use(express.static(publicDir));
    app.get(/^\/(?!api\/).*/, (_req, res) => {
      res.sendFile(path.join(publicDir, 'index.html'));
    });
  }

  app.use('/api', notFoundHandler);
  app.use(errorHandler);

  return app;
}
