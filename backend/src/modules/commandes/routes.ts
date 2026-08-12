import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { requireAuth, requireRole } from '../../middleware/auth';
import {
  changeStatutCommandeHandler,
  convertirEnFactureHandler,
  createCommandeHandler,
  deleteCommandeHandler,
  getCommandeHandler,
  listCommandesHandler,
  updateCommandeHandler,
} from './controller';

const router = Router();
const CAN_WRITE = ['ADMIN', 'DIRECTEUR', 'COMMERCIAL'];
const CAN_FACTURER = ['ADMIN', 'DIRECTEUR', 'COMPTABLE'];

router.get('/', requireAuth, asyncHandler(listCommandesHandler));
router.get('/:id', requireAuth, asyncHandler(getCommandeHandler));
router.post('/', requireAuth, requireRole(...CAN_WRITE), asyncHandler(createCommandeHandler));
router.put('/:id', requireAuth, requireRole(...CAN_WRITE), asyncHandler(updateCommandeHandler));
router.delete('/:id', requireAuth, requireRole(...CAN_WRITE), asyncHandler(deleteCommandeHandler));
router.post('/:id/statut', requireAuth, requireRole(...CAN_WRITE), asyncHandler(changeStatutCommandeHandler));
router.post('/:id/convertir-facture', requireAuth, requireRole(...CAN_FACTURER), asyncHandler(convertirEnFactureHandler));

export default router;
