import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { requireAuth, requireRole } from '../../middleware/auth';
import { changeStatutHandler, createHandler, deleteHandler, getHandler, getResumeHandler, listHandler, updateHandler } from './controller';

const router = Router();
const CAN_WRITE = ['ADMIN', 'DIRECTEUR', 'CONDUCTEUR_TRAVAUX'];

router.get('/', requireAuth, asyncHandler(listHandler));
router.get('/resume', requireAuth, asyncHandler(getResumeHandler));
router.get('/:id', requireAuth, asyncHandler(getHandler));
router.post('/', requireAuth, requireRole(...CAN_WRITE), asyncHandler(createHandler));
router.put('/:id', requireAuth, requireRole(...CAN_WRITE), asyncHandler(updateHandler));
router.delete('/:id', requireAuth, requireRole(...CAN_WRITE), asyncHandler(deleteHandler));
router.post('/:id/statut', requireAuth, requireRole(...CAN_WRITE), asyncHandler(changeStatutHandler));

export default router;
