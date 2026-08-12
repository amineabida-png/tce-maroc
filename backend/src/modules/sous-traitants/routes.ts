import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { requireAuth, requireRole } from '../../middleware/auth';
import {
  createSousTraitantHandler,
  deactivateSousTraitantHandler,
  getSousTraitantHandler,
  listSousTraitantsHandler,
  reactivateSousTraitantHandler,
  updateSousTraitantHandler,
} from './controller';

const router = Router();
const CAN_WRITE = ['ADMIN', 'DIRECTEUR', 'CONDUCTEUR_TRAVAUX'];

router.get('/', requireAuth, asyncHandler(listSousTraitantsHandler));
router.get('/:id', requireAuth, asyncHandler(getSousTraitantHandler));
router.post('/', requireAuth, requireRole(...CAN_WRITE), asyncHandler(createSousTraitantHandler));
router.put('/:id', requireAuth, requireRole(...CAN_WRITE), asyncHandler(updateSousTraitantHandler));
router.post('/:id/desactiver', requireAuth, requireRole(...CAN_WRITE), asyncHandler(deactivateSousTraitantHandler));
router.post('/:id/reactiver', requireAuth, requireRole(...CAN_WRITE), asyncHandler(reactivateSousTraitantHandler));

export default router;
