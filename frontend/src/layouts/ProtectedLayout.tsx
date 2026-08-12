import { HardHat, LayoutDashboard, LogOut, Truck, Users } from 'lucide-react';
import { Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { t } from '@/i18n';
import { logoutRequest } from '@/features/auth/api';
import { useAuthStore } from '@/store/auth';

const NAV_ITEMS = [
  { to: '/', label: t.nav.dashboard, icon: LayoutDashboard },
  { to: '/clients', label: t.nav.clients, icon: Users },
  { to: '/fournisseurs', label: t.nav.fournisseurs, icon: Truck },
  { to: '/sous-traitants', label: t.nav.sousTraitants, icon: HardHat },
];
// Les autres entrées (Chantiers, Devis, ...) seront ajoutées ici module par
// module, en même temps que leurs pages et routes.

export default function ProtectedLayout() {
  const user = useAuthStore((s) => s.user);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const clear = useAuthStore((s) => s.clear);
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/connexion" state={{ from: location.pathname }} replace />;
  }

  async function handleLogout() {
    if (refreshToken) await logoutRequest(refreshToken);
    clear();
    navigate('/connexion', { replace: true });
  }

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-64 flex-col border-r bg-card">
        <div className="border-b p-4">
          <p className="font-semibold">ERP TCE Maroc</p>
          <p className="text-xs text-muted-foreground">
            {user.prenom} {user.nom} · {user.role}
          </p>
        </div>
        <nav className="flex-1 space-y-1 p-2">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-accent'
                }`
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t p-2">
          <Button variant="ghost" className="w-full justify-start gap-2" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
            {t.auth.logout}
          </Button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
