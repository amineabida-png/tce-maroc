import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { requireAuth, requireRole } from '../../middleware/auth';
import {
  createMouvementHandler,
  deleteMouvementHandler,
  getEcheancierHandler,
  getJournalHandler,
  getMouvementHandler,
  listMouvementsHandler,
  rapprocherMouvementHandler,
  updateMouvementHandler,
} from './controller';

const router = Router();
const CAN_WRITE = ['ADMIN', 'DIRECTEUR', 'COMPTABLE'];

router.get('/journal', requireAuth, asyncHandler(getJournalHandler));
router.get('/echeancier', requireAuth, asyncHandler(getEcheancierHandler));
router.get('/', requireAuth, asyncHandler(listMouvementsHandler));
router.get('/:id', requireAuth, asyncHandler(getMouvementHandler));
router.post('/', requireAuth, requireRole(...CAN_WRITE), asyncHandler(createMouvementHandler));
router.put('/:id', requireAuth, requireRole(...CAN_WRITE), asyncHandler(updateMouvementHandler));
router.delete('/:id', requireAuth, requireRole(...CAN_WRITE), asyncHandler(deleteMouvementHandler));
router.post('/:id/rapprocher', requireAuth, requireRole(...CAN_WRITE), asyncHandler(rapprocherMouvementHandler));

export default router;
