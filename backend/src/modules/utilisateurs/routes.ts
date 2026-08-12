import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { requireAuth, requireRole } from '../../middleware/auth';
import {
  createUtilisateurHandler,
  deactivateUtilisateurHandler,
  listUtilisateursHandler,
  reactivateUtilisateurHandler,
  reinitialiserMotDePasseHandler,
  updateUtilisateurHandler,
} from './controller';

const router = Router();
// Gestion des comptes/mots de passe : action sensible, réservée à
// l'encadrement plutôt qu'ouverte aux mêmes rôles "métier" que le reste de
// l'app (ex. COMPTABLE, qui gère pourtant des données tout aussi sensibles
// côté finances).
const CAN_MANAGE = ['ADMIN', 'DIRECTEUR'];

router.get('/', requireAuth, asyncHandler(listUtilisateursHandler));
router.post('/', requireAuth, requireRole(...CAN_MANAGE), asyncHandler(createUtilisateurHandler));
router.put('/:id', requireAuth, requireRole(...CAN_MANAGE), asyncHandler(updateUtilisateurHandler));
router.post('/:id/desactiver', requireAuth, requireRole(...CAN_MANAGE), asyncHandler(deactivateUtilisateurHandler));
router.post('/:id/reactiver', requireAuth, requireRole(...CAN_MANAGE), asyncHandler(reactivateUtilisateurHandler));
router.post('/:id/reinitialiser-mot-de-passe', requireAuth, requireRole(...CAN_MANAGE), asyncHandler(reinitialiserMotDePasseHandler));

export default router;
