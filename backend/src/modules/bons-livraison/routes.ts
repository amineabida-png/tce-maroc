import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { requireAuth, requireRole } from '../../middleware/auth';
import { createHandler, deleteHandler, getHandler, getResumeHandler, listHandler, updateHandler } from './controller';

const router = Router();
const CAN_WRITE = ['ADMIN', 'DIRECTEUR', 'COMMERCIAL', 'MAGASINIER'];

router.get('/', requireAuth, asyncHandler(listHandler));
router.get('/resume', requireAuth, asyncHandler(getResumeHandler));
router.get('/:id', requireAuth, asyncHandler(getHandler));
router.post('/', requireAuth, requireRole(...CAN_WRITE), asyncHandler(createHandler));
router.put('/:id', requireAuth, requireRole(...CAN_WRITE), asyncHandler(updateHandler));
router.delete('/:id', requireAuth, requireRole(...CAN_WRITE), asyncHandler(deleteHandler));

export default router;
