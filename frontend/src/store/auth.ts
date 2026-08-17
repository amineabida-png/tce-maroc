import { create } from 'zustand';

export interface AuthUser {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  role: string;
  couleurPrimaire?: string | null;
  couleurAccent?: string | null;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  setAuth: (tokens: { accessToken: string; refreshToken: string }, user?: AuthUser) => void;
  updateUser: (partial: Partial<AuthUser>) => void;
  clear: () => void;
}

const REFRESH_KEY = 'tce_refresh_token';
const USER_KEY = 'tce_user';

function loadUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

// Le jeton d'accès (courte durée de vie) reste uniquement en mémoire ; seul
// le refresh token (longue durée) est persisté, pour reconnecter
// silencieusement l'utilisateur au rechargement de la page.
export const useAuthStore = create<AuthState>((set) => ({
  user: loadUser(),
  accessToken: null,
  refreshToken: localStorage.getItem(REFRESH_KEY),
  setAuth: (tokens, user) => {
    localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    set((state) => ({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: user ?? state.user,
    }));
  },
  updateUser: (partial) => {
    set((state) => {
      if (!state.user) return state;
      const user = { ...state.user, ...partial };
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      return { user };
    });
  },
  clear: () => {
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
    set({ user: null, accessToken: null, refreshToken: null });
  },
}));
