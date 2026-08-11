import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { t } from '@/i18n';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/store/auth';

interface Societe {
  nom: string;
  ville: string | null;
  ice: string | null;
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { data: societe, isLoading, error } = useQuery({
    queryKey: ['societe'],
    queryFn: () => apiFetch<Societe>('/api/societe'),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">
          {t.dashboard.welcome}, {user?.prenom} 👋
        </h1>
        <p className="text-muted-foreground">{t.dashboard.placeholder}</p>
      </div>

      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Société</CardTitle>
          <CardDescription>Connexion API vérifiée via /api/societe</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && <p className="text-sm text-muted-foreground">{t.common.loading}</p>}
          {error && <p className="text-sm text-destructive">{(error as Error).message}</p>}
          {societe && (
            <dl className="space-y-1 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Nom</dt>
                <dd>{societe.nom}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Ville</dt>
                <dd>{societe.ville || '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">ICE</dt>
                <dd>{societe.ice || '—'}</dd>
              </div>
            </dl>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
