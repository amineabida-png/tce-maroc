import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { requireAuth, requireRole } from '../../middleware/auth';
import {
  changeStatutDevisHandler,
  convertirEnCommandeHandler,
  createDevisHandler,
  deleteDevisHandler,
  getDevisHandler,
  getResumeHandler,
  listDevisHandler,
  updateDevisHandler,
} from './controller';

const router = Router();
const CAN_WRITE = ['ADMIN', 'DIRECTEUR', 'COMMERCIAL'];

router.get('/', requireAuth, asyncHandler(listDevisHandler));
router.get('/resume', requireAuth, asyncHandler(getResumeHandler));
router.get('/:id', requireAuth, asyncHandler(getDevisHandler));
router.post('/', requireAuth, requireRole(...CAN_WRITE), asyncHandler(createDevisHandler));
router.put('/:id', requireAuth, requireRole(...CAN_WRITE), asyncHandler(updateDevisHandler));
router.delete('/:id', requireAuth, requireRole(...CAN_WRITE), asyncHandler(deleteDevisHandler));
router.post('/:id/statut', requireAuth, requireRole(...CAN_WRITE), asyncHandler(changeStatutDevisHandler));
router.post('/:id/convertir-commande', requireAuth, requireRole(...CAN_WRITE), asyncHandler(convertirEnCommandeHandler));

export default router;
