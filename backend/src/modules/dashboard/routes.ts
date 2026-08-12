import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { requireAuth } from '../../middleware/auth';
import { getDashboardHandler } from './controller';

const router = Router();

router.get('/', requireAuth, asyncHandler(getDashboardHandler));

export default router;
