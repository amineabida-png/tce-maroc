import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { requireAuth, requireRole } from '../../middleware/auth';
import {
  createFournisseurHandler,
  deactivateFournisseurHandler,
  getFournisseurHandler,
  getResumeHandler,
  listFournisseursHandler,
  reactivateFournisseurHandler,
  updateFournisseurHandler,
} from './controller';

const router = Router();
const CAN_WRITE = ['ADMIN', 'DIRECTEUR', 'MAGASINIER'];

router.get('/', requireAuth, asyncHandler(listFournisseursHandler));
router.get('/resume', requireAuth, asyncHandler(getResumeHandler));
router.get('/:id', requireAuth, asyncHandler(getFournisseurHandler));
router.post('/', requireAuth, requireRole(...CAN_WRITE), asyncHandler(createFournisseurHandler));
router.put('/:id', requireAuth, requireRole(...CAN_WRITE), asyncHandler(updateFournisseurHandler));
router.post('/:id/desactiver', requireAuth, requireRole(...CAN_WRITE), asyncHandler(deactivateFournisseurHandler));
router.post('/:id/reactiver', requireAuth, requireRole(...CAN_WRITE), asyncHandler(reactivateFournisseurHandler));

export default router;
