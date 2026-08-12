import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { requireAuth, requireRole } from '../../middleware/auth';
import { createSortieHandler, listMouvementsHandler } from './controller';

const router = Router();
const CAN_WRITE = ['ADMIN', 'DIRECTEUR', 'MAGASINIER', 'CONDUCTEUR_TRAVAUX'];

router.get('/', requireAuth, asyncHandler(listMouvementsHandler));
router.post('/sortie', requireAuth, requireRole(...CAN_WRITE), asyncHandler(createSortieHandler));

export default router;
