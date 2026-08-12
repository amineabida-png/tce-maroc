import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { requireAuth, requireRole } from '../../middleware/auth';
import {
  createCompteHandler,
  deactivateCompteHandler,
  getCompteHandler,
  listComptesHandler,
  reactivateCompteHandler,
  updateCompteHandler,
} from './controller';

const router = Router();
const CAN_WRITE = ['ADMIN', 'DIRECTEUR', 'COMPTABLE'];

router.get('/', requireAuth, asyncHandler(listComptesHandler));
router.get('/:id', requireAuth, asyncHandler(getCompteHandler));
router.post('/', requireAuth, requireRole(...CAN_WRITE), asyncHandler(createCompteHandler));
router.put('/:id', requireAuth, requireRole(...CAN_WRITE), asyncHandler(updateCompteHandler));
router.post('/:id/desactiver', requireAuth, requireRole(...CAN_WRITE), asyncHandler(deactivateCompteHandler));
router.post('/:id/reactiver', requireAuth, requireRole(...CAN_WRITE), asyncHandler(reactivateCompteHandler));

export default router;
