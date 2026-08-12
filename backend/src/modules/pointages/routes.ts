import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { requireAuth, requireRole } from '../../middleware/auth';
import { coutMainDoeuvreHandler, deletePointageHandler, listPointagesHandler, upsertPointageHandler } from './controller';

const router = Router();
const CAN_WRITE = ['ADMIN', 'DIRECTEUR', 'CONDUCTEUR_TRAVAUX'];

router.get('/cout-main-doeuvre', requireAuth, asyncHandler(coutMainDoeuvreHandler));
router.get('/', requireAuth, asyncHandler(listPointagesHandler));
router.post('/', requireAuth, requireRole(...CAN_WRITE), asyncHandler(upsertPointageHandler));
router.delete('/:id', requireAuth, requireRole(...CAN_WRITE), asyncHandler(deletePointageHandler));

export default router;
