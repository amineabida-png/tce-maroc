import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Banknote, Building2, Clock, PackageSearch, Receipt } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { STATUT_CHANTIER_LABELS, STATUT_CHANTIER_VARIANT, type StatutChantier } from '@/features/chantiers/types';
import { apiFetch } from '@/lib/api';
import { formatMAD } from '@/lib/currency';
import { useAuthStore } from '@/store/auth';
import { CAChart } from './CAChart';
import type { Dashboard } from './types';

interface Societe {
  nom: string;
  ville: string | null;
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  const { data: societe } = useQuery({
    queryKey: ['societe'],
    queryFn: () => apiFetch<Societe>('/api/societe'),
  });
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => apiFetch<Dashboard>('/api/dashboard'),
  });

  const alertes = [
    data && data.facturesEnRetard > 0
      ? { label: `${data.facturesEnRetard} facture${data.facturesEnRetard > 1 ? 's' : ''} en retard de paiement`, onClick: () => navigate('/factures') }
      : null,
    data && data.stockSousSeuil > 0
      ? { label: `${data.stockSousSeuil} article${data.stockSousSeuil > 1 ? 's' : ''} sous le seuil d'alerte`, onClick: () => navigate('/articles') }
      : null,
    data && data.decaissementsPlanifies7j > 0
      ? { label: `${formatMAD(data.decaissementsPlanifies7j)} de décaissements planifiés d'ici 7 jours`, onClick: () => navigate('/finances') }
      : null,
  ].filter((a): a is { label: string; onClick: () => void } => a !== null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Bienvenue, {user?.prenom} 👋</h1>
        <p className="text-muted-foreground">
          {societe ? `${societe.nom}${societe.ville ? ` — ${societe.ville}` : ''}` : 'Vue d’ensemble de l’activité.'}
        </p>
      </div>

      {isLoading && <p className="text-muted-foreground">Chargement…</p>}

      {data && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Building2 className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground">Chantiers actifs</p>
                  <p className="text-xl font-semibold leading-tight">{data.chantiersActifs}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                  <Receipt className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground">CA du mois (TTC)</p>
                  <p className="truncate text-xl font-semibold leading-tight">{formatMAD(data.caMoisCourant.montantTTC)}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Banknote className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground">Trésorerie disponible</p>
                  <p className="truncate text-xl font-semibold leading-tight">{formatMAD(data.tresorerieDisponible)}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                  <Clock className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground">Créances clients</p>
                  <p className="truncate text-xl font-semibold leading-tight">{formatMAD(data.creancesClients)}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Chiffre d'affaires — 6 derniers mois</CardTitle>
              </CardHeader>
              <CardContent>
                <CAChart lignes={data.caSixDerniersMois} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Alertes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {alertes.length === 0 && <p className="text-sm text-muted-foreground">Aucune alerte.</p>}
                {alertes.map((a) => (
                  <button
                    key={a.label}
                    onClick={a.onClick}
                    className="flex w-full items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-2.5 text-left text-sm hover:bg-destructive/10"
                  >
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                    <span>{a.label}</span>
                  </button>
                ))}
                <div className="flex items-center gap-2 pt-2 text-sm text-muted-foreground">
                  <PackageSearch className="h-4 w-4" />
                  Valorisation stock : {formatMAD(data.stockValorisation)}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {data.pointagesAujourdhui} présence{data.pointagesAujourdhui > 1 ? 's' : ''} pointée{data.pointagesAujourdhui > 1 ? 's' : ''} aujourd'hui
                </div>
              </CardContent>
            </Card>
          </div>

          {data.chantiersParStatut.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Chantiers par statut</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {data.chantiersParStatut.map((c) => (
                  <Badge key={c.statut} variant={STATUT_CHANTIER_VARIANT[c.statut as StatutChantier]}>
                    {STATUT_CHANTIER_LABELS[c.statut as StatutChantier]} · {c.nombre}
                  </Badge>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
