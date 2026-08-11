import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { requireAuth, requireRole } from '../../middleware/auth';
import { getSocieteHandler, updateSocieteHandler, upsertNumerotationHandler } from './controller';

const router = Router();

router.get('/', requireAuth, asyncHandler(getSocieteHandler));
router.put('/', requireAuth, requireRole('ADMIN', 'DIRECTEUR'), asyncHandler(updateSocieteHandler));
router.put(
  '/numerotations',
  requireAuth,
  requireRole('ADMIN', 'DIRECTEUR'),
  asyncHandler(upsertNumerotationHandler)
);

export default router;
