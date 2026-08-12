import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { requireAuth, requireRole } from '../../middleware/auth';
import {
  createClientHandler,
  deactivateClientHandler,
  getClientHandler,
  listClientsHandler,
  reactivateClientHandler,
  updateClientHandler,
} from './controller';

const router = Router();
const CAN_WRITE = ['ADMIN', 'DIRECTEUR', 'COMMERCIAL'];

router.get('/', requireAuth, asyncHandler(listClientsHandler));
router.get('/:id', requireAuth, asyncHandler(getClientHandler));
router.post('/', requireAuth, requireRole(...CAN_WRITE), asyncHandler(createClientHandler));
router.put('/:id', requireAuth, requireRole(...CAN_WRITE), asyncHandler(updateClientHandler));
router.post('/:id/desactiver', requireAuth, requireRole(...CAN_WRITE), asyncHandler(deactivateClientHandler));
router.post('/:id/reactiver', requireAuth, requireRole(...CAN_WRITE), asyncHandler(reactivateClientHandler));

export default router;
