import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { requireAuth, requireRole } from '../../middleware/auth';
import {
  createChantierHandler,
  createDepenseHandler,
  createTacheHandler,
  deactivateChantierHandler,
  deleteDepenseHandler,
  deleteTacheHandler,
  getBudgetSummaryHandler,
  getChantierHandler,
  listChantiersHandler,
  listDepensesHandler,
  listTachesHandler,
  reactivateChantierHandler,
  updateChantierHandler,
  updateTacheHandler,
} from './controller';

const router = Router();
const CAN_WRITE_CHANTIER = ['ADMIN', 'DIRECTEUR', 'CONDUCTEUR_TRAVAUX'];
const CAN_WRITE_DEPENSE = ['ADMIN', 'DIRECTEUR', 'COMPTABLE', 'CONDUCTEUR_TRAVAUX'];

router.get('/', requireAuth, asyncHandler(listChantiersHandler));
router.get('/:id', requireAuth, asyncHandler(getChantierHandler));
router.post('/', requireAuth, requireRole(...CAN_WRITE_CHANTIER), asyncHandler(createChantierHandler));
router.put('/:id', requireAuth, requireRole(...CAN_WRITE_CHANTIER), asyncHandler(updateChantierHandler));
router.post('/:id/desactiver', requireAuth, requireRole(...CAN_WRITE_CHANTIER), asyncHandler(deactivateChantierHandler));
router.post('/:id/reactiver', requireAuth, requireRole(...CAN_WRITE_CHANTIER), asyncHandler(reactivateChantierHandler));
router.get('/:id/budget', requireAuth, asyncHandler(getBudgetSummaryHandler));

router.get('/:id/taches', requireAuth, asyncHandler(listTachesHandler));
router.post('/:id/taches', requireAuth, requireRole(...CAN_WRITE_CHANTIER), asyncHandler(createTacheHandler));
router.put('/:id/taches/:tacheId', requireAuth, requireRole(...CAN_WRITE_CHANTIER), asyncHandler(updateTacheHandler));
router.delete('/:id/taches/:tacheId', requireAuth, requireRole(...CAN_WRITE_CHANTIER), asyncHandler(deleteTacheHandler));

router.get('/:id/depenses', requireAuth, asyncHandler(listDepensesHandler));
router.post('/:id/depenses', requireAuth, requireRole(...CAN_WRITE_DEPENSE), asyncHandler(createDepenseHandler));
router.delete('/:id/depenses/:depenseId', requireAuth, requireRole(...CAN_WRITE_DEPENSE), asyncHandler(deleteDepenseHandler));

export default router;
