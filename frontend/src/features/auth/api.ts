import { ApiError } from '@/lib/api';
import type { AuthUser } from '@/store/auth';

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

// Volontairement en dehors d'apiFetch : le login n'a pas encore de jeton, et
// ne doit surtout pas déclencher la logique de rafraîchissement.
export async function login(email: string, motDePasse: string): Promise<LoginResponse> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, motDePasse }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.error || 'Échec de connexion.');
  }
  return res.json();
}

export async function logoutRequest(refreshToken: string): Promise<void> {
  await fetch('/api/auth/logout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  }).catch(() => {});
}
