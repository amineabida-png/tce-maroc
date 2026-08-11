import { useAuthStore } from '@/store/auth';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function parseError(res: Response): Promise<string> {
  try {
    const body = await res.json();
    return body.error || `Erreur ${res.status}`;
  } catch {
    return `Erreur ${res.status}`;
  }
}

async function rawRefresh(refreshToken: string): Promise<{ accessToken: string; refreshToken: string } | null> {
  const res = await fetch('/api/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) return null;
  return res.json();
}

let refreshInFlight: Promise<{ accessToken: string; refreshToken: string } | null> | null = null;

// Toute requête protégée passe par ici : ajoute le jeton d'accès, et si le
// serveur répond 401 (jeton expiré), tente UNE fois un rafraîchissement
// silencieux puis rejoue la requête — sinon déconnecte proprement.
export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const { accessToken, refreshToken, setAuth, clear } = useAuthStore.getState();

  const doFetch = (token: string | null) =>
    fetch(path, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });

  let res = await doFetch(accessToken);

  if (res.status === 401 && refreshToken) {
    refreshInFlight ??= rawRefresh(refreshToken).finally(() => {
      refreshInFlight = null;
    });
    const refreshed = await refreshInFlight;
    if (refreshed) {
      setAuth(refreshed);
      res = await doFetch(refreshed.accessToken);
    } else {
      clear();
      throw new ApiError(401, 'Session expirée — reconnectez-vous.');
    }
  }

  if (!res.ok) {
    throw new ApiError(res.status, await parseError(res));
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}
