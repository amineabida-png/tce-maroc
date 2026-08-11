import type { Request, Response } from 'express';
import { loginSchema, refreshSchema } from './schema';
import * as authService from './service';

export async function loginHandler(req: Request, res: Response): Promise<void> {
  const { email, motDePasse } = loginSchema.parse(req.body);
  const result = await authService.login(email, motDePasse);
  res.json(result);
}

export async function refreshHandler(req: Request, res: Response): Promise<void> {
  const { refreshToken } = refreshSchema.parse(req.body);
  const result = await authService.refresh(refreshToken);
  res.json(result);
}

export async function logoutHandler(req: Request, res: Response): Promise<void> {
  const { refreshToken } = refreshSchema.parse(req.body);
  await authService.logout(refreshToken);
  res.json({ ok: true });
}

export async function meHandler(req: Request, res: Response): Promise<void> {
  res.json({ user: req.user });
}
