import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { requireAuth, requireRole } from '../../middleware/auth';
import {
  createArticleHandler,
  deactivateArticleHandler,
  getArticleHandler,
  listArticlesHandler,
  reactivateArticleHandler,
  updateArticleHandler,
} from './controller';

const router = Router();
const CAN_WRITE = ['ADMIN', 'DIRECTEUR', 'MAGASINIER'];

router.get('/', requireAuth, asyncHandler(listArticlesHandler));
router.get('/:id', requireAuth, asyncHandler(getArticleHandler));
router.post('/', requireAuth, requireRole(...CAN_WRITE), asyncHandler(createArticleHandler));
router.put('/:id', requireAuth, requireRole(...CAN_WRITE), asyncHandler(updateArticleHandler));
router.post('/:id/desactiver', requireAuth, requireRole(...CAN_WRITE), asyncHandler(deactivateArticleHandler));
router.post('/:id/reactiver', requireAuth, requireRole(...CAN_WRITE), asyncHandler(reactivateArticleHandler));

export default router;
