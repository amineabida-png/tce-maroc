import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { requireAuth, requireRole } from '../../middleware/auth';
import {
  createOuvrageHandler,
  deactivateOuvrageHandler,
  getOuvrageHandler,
  listOuvragesHandler,
  reactivateOuvrageHandler,
  updateOuvrageHandler,
} from './controller';

const router = Router();
const CAN_WRITE = ['ADMIN', 'DIRECTEUR'];

router.get('/', requireAuth, asyncHandler(listOuvragesHandler));
router.get('/:id', requireAuth, asyncHandler(getOuvrageHandler));
router.post('/', requireAuth, requireRole(...CAN_WRITE), asyncHandler(createOuvrageHandler));
router.put('/:id', requireAuth, requireRole(...CAN_WRITE), asyncHandler(updateOuvrageHandler));
router.post('/:id/desactiver', requireAuth, requireRole(...CAN_WRITE), asyncHandler(deactivateOuvrageHandler));
router.post('/:id/reactiver', requireAuth, requireRole(...CAN_WRITE), asyncHandler(reactivateOuvrageHandler));

export default router;
