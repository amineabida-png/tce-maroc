import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { requireAuth } from '../../middleware/auth';
import { listUtilisateursHandler } from './controller';

const router = Router();

router.get('/', requireAuth, asyncHandler(listUtilisateursHandler));

export default router;
