import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { requireAuth, requireRole } from '../../middleware/auth';
import { listActionsDistinctesHandler, listJournalAuditHandler } from './controller';

const router = Router();
// Le journal retrace l'activité de tous les utilisateurs — réservé à
// l'encadrement, comme la gestion des comptes.
const CAN_VIEW = ['ADMIN', 'DIRECTEUR'];

router.get('/journal-audit', requireAuth, requireRole(...CAN_VIEW), asyncHandler(listJournalAuditHandler));
router.get('/journal-audit/actions', requireAuth, requireRole(...CAN_VIEW), asyncHandler(listActionsDistinctesHandler));

export default router;
