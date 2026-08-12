import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ApiError } from '@/lib/api';
import * as api from './api';
import { TacheFormDialog } from './TacheFormDialog';
import { STATUT_TACHE_LABELS, type TacheChantier } from './types';

function computeRange(taches: TacheChantier[]): { start: number; end: number } | null {
  const dates = taches
    .flatMap((t) => [t.dateDebut, t.dateFin])
    .filter((d): d is string => Boolean(d))
    .map((d) => new Date(d).getTime());
  if (!dates.length) return null;
  const start = Math.min(...dates);
  const end = Math.max(...dates);
  return end > start ? { start, end } : { start, end: start + 24 * 60 * 60 * 1000 };
}

const STATUT_BAR_COLOR: Record<TacheChantier['statut'], string> = {
  A_FAIRE: 'bg-muted-foreground/40',
  EN_COURS: 'bg-primary',
  TERMINEE: 'bg-emerald-500',
  BLOQUEE: 'bg-destructive',
};

export function TachesTab({ chantierId }: { chantierId: string }) {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TacheChantier | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const { data: taches = [] } = useQuery({
    queryKey: ['chantier', chantierId, 'taches'],
    queryFn: () => api.fetchTaches(chantierId),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['chantier', chantierId, 'taches'] });

  const createMutation = useMutation({
    mutationFn: (values: api.TacheFormValues) => api.createTache(chantierId, values),
    onSuccess: () => {
      invalidate();
      setDialogOpen(false);
    },
    onError: (err) => setFormError(err instanceof ApiError ? err.message : 'Erreur inattendue.'),
  });
  const updateMutation = useMutation({
    mutationFn: (vars: { id: string; values: api.TacheFormValues }) => api.updateTache(chantierId, vars.id, vars.values),
    onSuccess: () => {
      invalidate();
      setDialogOpen(false);
    },
    onError: (err) => setFormError(err instanceof ApiError ? err.message : 'Erreur inattendue.'),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteTache(chantierId, id),
    onSuccess: invalidate,
  });

  function openCreate() {
    setEditing(null);
    setFormError(null);
    setDialogOpen(true);
  }
  function openEdit(t: TacheChantier) {
    setEditing(t);
    setFormError(null);
    setDialogOpen(true);
  }
  async function handleSubmit(values: api.TacheFormValues) {
    setFormError(null);
    if (editing) await updateMutation.mutateAsync({ id: editing.id, values });
    else await createMutation.mutateAsync(values);
  }

  const range = computeRange(taches);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Planning</h3>
        <Button size="sm" className="gap-2" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Nouvelle tâche
        </Button>
      </div>

      {taches.length === 0 && <p className="text-sm text-muted-foreground">Aucune tâche planifiée.</p>}

      {taches.length > 0 && (
        <Card>
          <CardContent className="space-y-3 pt-6">
            {taches.map((t) => {
              const hasDates = t.dateDebut && t.dateFin && range;
              let leftPct = 0;
              let widthPct = 100;
              if (hasDates && range) {
                const start = new Date(t.dateDebut as string).getTime();
                const end = new Date(t.dateFin as string).getTime();
                const span = range.end - range.start || 1;
                leftPct = ((start - range.start) / span) * 100;
                widthPct = Math.max(2, ((end - start) / span) * 100);
              }
              return (
                <div key={t.id} className="group">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <button className="text-sm font-medium hover:underline" onClick={() => openEdit(t)}>
                      {t.nom}
                    </button>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {STATUT_TACHE_LABELS[t.statut]}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{t.avancement}%</span>
                      <button
                        className="text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                        onClick={() => deleteMutation.mutate(t.id)}
                        title="Supprimer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="relative h-3 w-full rounded-full bg-muted">
                    {hasDates ? (
                      <div
                        className={`absolute h-full rounded-full ${STATUT_BAR_COLOR[t.statut]}`}
                        style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                        title={`${t.dateDebut?.slice(0, 10)} → ${t.dateFin?.slice(0, 10)}`}
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center px-2 text-[10px] text-muted-foreground">
                        Dates non renseignées
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <TacheFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        tache={editing}
        autresTaches={taches}
        nextOrdre={taches.length}
        onSubmit={handleSubmit}
        submitting={createMutation.isPending || updateMutation.isPending}
        error={formError}
      />
    </div>
  );
}
