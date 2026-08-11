import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { asyncHandler } from '../../lib/asyncHandler';
import { requireAuth } from '../../middleware/auth';
import { loginHandler, logoutHandler, meHandler, refreshHandler } from './controller';

const router = Router();

// Limite dédiée sur /login : cible spécifiquement le bruteforce de mot de
// passe sans pénaliser le reste de l'API.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de tentatives — réessayez dans quelques minutes.' },
});

router.post('/login', loginLimiter, asyncHandler(loginHandler));
router.post('/refresh', asyncHandler(refreshHandler));
router.post('/logout', asyncHandler(logoutHandler));
router.get('/me', requireAuth, asyncHandler(meHandler));

export default router;
