import {
  BarChart3,
  Boxes,
  Building2,
  FileStack,
  FileText,
  HardHat,
  IdCard,
  LayoutDashboard,
  LogOut,
  PackageSearch,
  PiggyBank,
  Receipt,
  Ruler,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Truck,
  Users,
} from 'lucide-react';
import { Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { t } from '@/i18n';
import { logoutRequest } from '@/features/auth/api';
import { useAuthStore } from '@/store/auth';

// Regroupée par usage plutôt qu'en liste plate : à 17 entrées, une liste
// plate devient difficile à scanner — les sections reflètent les grandes
// familles de travail de l'entreprise (chantier, achats, partenaires...).
const NAV_SECTIONS = [
  {
    label: null,
    items: [{ to: '/', label: t.nav.dashboard, icon: LayoutDashboard }],
  },
  {
    label: 'Chantiers & documents',
    items: [
      { to: '/chantiers', label: t.nav.chantiers, icon: Building2 },
      { to: '/devis', label: t.nav.devis, icon: FileText },
      { to: '/commandes', label: t.nav.commandes, icon: FileStack },
      { to: '/factures', label: t.nav.factures, icon: Receipt },
      { to: '/ouvrages', label: t.nav.ouvrages, icon: Ruler },
    ],
  },
  {
    label: 'Achats & stock',
    items: [
      { to: '/commandes-fournisseur', label: t.nav.achats, icon: ShoppingCart },
      { to: '/articles', label: t.nav.articles, icon: PackageSearch },
      { to: '/stock', label: t.nav.stock, icon: Boxes },
    ],
  },
  {
    label: 'Partenaires',
    items: [
      { to: '/clients', label: t.nav.clients, icon: Users },
      { to: '/fournisseurs', label: t.nav.fournisseurs, icon: Truck },
      { to: '/sous-traitants', label: t.nav.sousTraitants, icon: HardHat },
    ],
  },
  {
    label: 'RH & finances',
    items: [
      { to: '/rh', label: t.nav.rh, icon: IdCard },
      { to: '/finances', label: t.nav.finances, icon: PiggyBank },
    ],
  },
  {
    label: 'Pilotage',
    items: [{ to: '/reporting', label: t.nav.reporting, icon: BarChart3 }],
  },
  {
    label: 'Système',
    items: [
      { to: '/administration', label: t.nav.administration, icon: ShieldCheck },
      { to: '/parametres', label: t.nav.parametres, icon: Settings },
    ],
  },
];

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
      <aside className="flex w-64 shrink-0 flex-col border-r bg-card">
        <div className="flex items-center gap-2.5 border-b p-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <HardHat className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold leading-tight">ERP TCE Maroc</p>
            <p className="truncate text-xs text-muted-foreground">
              {user.prenom} {user.nom} · {user.role}
            </p>
          </div>
        </div>
        <nav className="flex-1 space-y-4 overflow-y-auto p-3">
          {NAV_SECTIONS.map((section, i) => (
            <div key={section.label ?? `section-${i}`} className="space-y-1">
              {section.label && (
                <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                  {section.label}
                </p>
              )}
              {section.items.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 rounded-md border-l-2 px-2.5 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? 'border-brand bg-primary text-primary-foreground'
                        : 'border-transparent text-foreground hover:border-border hover:bg-accent'
                    }`
                  }
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{label}</span>
                </NavLink>
              ))}
            </div>
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
