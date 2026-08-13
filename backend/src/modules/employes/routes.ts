import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { requireAuth, requireRole } from '../../middleware/auth';
import {
  createEmployeHandler,
  deactivateEmployeHandler,
  exportPaieHandler,
  getEmployeHandler,
  getResumeHandler,
  listEmployesHandler,
  reactivateEmployeHandler,
  updateEmployeHandler,
} from './controller';

const router = Router();
const CAN_WRITE = ['ADMIN', 'DIRECTEUR'];
const CAN_EXPORT_PAIE = ['ADMIN', 'DIRECTEUR', 'COMPTABLE'];

router.get('/export-paie', requireAuth, requireRole(...CAN_EXPORT_PAIE), asyncHandler(exportPaieHandler));
router.get('/resume', requireAuth, asyncHandler(getResumeHandler));
router.get('/', requireAuth, asyncHandler(listEmployesHandler));
router.get('/:id', requireAuth, asyncHandler(getEmployeHandler));
router.post('/', requireAuth, requireRole(...CAN_WRITE), asyncHandler(createEmployeHandler));
router.put('/:id', requireAuth, requireRole(...CAN_WRITE), asyncHandler(updateEmployeHandler));
router.post('/:id/desactiver', requireAuth, requireRole(...CAN_WRITE), asyncHandler(deactivateEmployeHandler));
router.post('/:id/reactiver', requireAuth, requireRole(...CAN_WRITE), asyncHandler(reactivateEmployeHandler));

export default router;
