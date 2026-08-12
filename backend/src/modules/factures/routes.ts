import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { requireAuth, requireRole } from '../../middleware/auth';
import {
  addPaiementHandler,
  annulerFactureHandler,
  createFactureHandler,
  deleteFactureHandler,
  deletePaiementHandler,
  envoyerFactureHandler,
  getFactureHandler,
  listFacturesHandler,
  updateFactureHandler,
} from './controller';

const router = Router();
const CAN_WRITE = ['ADMIN', 'DIRECTEUR', 'COMPTABLE'];

router.get('/', requireAuth, asyncHandler(listFacturesHandler));
router.get('/:id', requireAuth, asyncHandler(getFactureHandler));
router.post('/', requireAuth, requireRole(...CAN_WRITE), asyncHandler(createFactureHandler));
router.put('/:id', requireAuth, requireRole(...CAN_WRITE), asyncHandler(updateFactureHandler));
router.delete('/:id', requireAuth, requireRole(...CAN_WRITE), asyncHandler(deleteFactureHandler));
router.post('/:id/envoyer', requireAuth, requireRole(...CAN_WRITE), asyncHandler(envoyerFactureHandler));
router.post('/:id/annuler', requireAuth, requireRole(...CAN_WRITE), asyncHandler(annulerFactureHandler));
router.post('/:id/paiements', requireAuth, requireRole(...CAN_WRITE), asyncHandler(addPaiementHandler));
router.delete('/:id/paiements/:paiementId', requireAuth, requireRole(...CAN_WRITE), asyncHandler(deletePaiementHandler));

export default router;
