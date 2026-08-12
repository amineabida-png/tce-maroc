import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { requireAuth } from '../../middleware/auth';
import {
  exportCAHandler,
  exportImpayesHandler,
  exportMargeChantiersHandler,
  exportStockHandler,
  getCAHandler,
  getImpayesHandler,
  getMargeChantiersHandler,
  getStockHandler,
} from './controller';

const router = Router();

router.get('/ca', requireAuth, asyncHandler(getCAHandler));
router.get('/ca/export', requireAuth, asyncHandler(exportCAHandler));
router.get('/marge-chantiers', requireAuth, asyncHandler(getMargeChantiersHandler));
router.get('/marge-chantiers/export', requireAuth, asyncHandler(exportMargeChantiersHandler));
router.get('/stock', requireAuth, asyncHandler(getStockHandler));
router.get('/stock/export', requireAuth, asyncHandler(exportStockHandler));
router.get('/impayes', requireAuth, asyncHandler(getImpayesHandler));
router.get('/impayes/export', requireAuth, asyncHandler(exportImpayesHandler));

export default router;
