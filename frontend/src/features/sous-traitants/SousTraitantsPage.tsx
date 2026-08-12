import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, RotateCcw, Search, XCircle } from 'lucide-react';
import { PaginationBar } from '@/components/PaginationBar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ApiError } from '@/lib/api';
import * as api from './api';
import { SousTraitantFormDialog } from './SousTraitantFormDialog';
import type { SousTraitant } from './types';

export default function SousTraitantsPage() {
  const queryClient = useQueryClient();
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [showInactifs, setShowInactifs] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SousTraitant | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['sous-traitants', q, page, showInactifs],
    queryFn: () => api.fetchSousTraitants({ q, page, includeInactifs: showInactifs }),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['sous-traitants'] });

  const createMutation = useMutation({
    mutationFn: api.createSousTraitant,
    onSuccess: () => {
      invalidate();
      setDialogOpen(false);
    },
    onError: (err) => setFormError(err instanceof ApiError ? err.message : 'Erreur inattendue.'),
  });
  const updateMutation = useMutation({
    mutationFn: (vars: { id: string; values: api.SousTraitantFormValues }) => api.updateSousTraitant(vars.id, vars.values),
    onSuccess: () => {
      invalidate();
      setDialogOpen(false);
    },
    onError: (err) => setFormError(err instanceof ApiError ? err.message : 'Erreur inattendue.'),
  });
  const deactivateMutation = useMutation({ mutationFn: api.deactivateSousTraitant, onSuccess: invalidate });
  const reactivateMutation = useMutation({ mutationFn: api.reactivateSousTraitant, onSuccess: invalidate });

  function openCreate() {
    setEditing(null);
    setFormError(null);
    setDialogOpen(true);
  }
  function openEdit(s: SousTraitant) {
    setEditing(s);
    setFormError(null);
    setDialogOpen(true);
  }
  async function handleSubmit(values: api.SousTraitantFormValues) {
    setFormError(null);
    if (editing) await updateMutation.mutateAsync({ id: editing.id, values });
    else await createMutation.mutateAsync(values);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Sous-traitants</h1>
          <p className="text-muted-foreground">Main-d'œuvre spécialisée par corps d'état.</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Nouveau sous-traitant
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-72 max-w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher (nom, ICE, corps d'état)…"
            className="pl-9"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={showInactifs}
            onChange={(e) => {
              setShowInactifs(e.target.checked);
              setPage(1);
            }}
          />
          Afficher les sous-traitants désactivés
        </label>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Corps d'état</TableHead>
              <TableHead>Évaluation</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Chargement…
                </TableCell>
              </TableRow>
            )}
            {!isLoading && data?.items.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Aucun sous-traitant.
                </TableCell>
              </TableRow>
            )}
            {data?.items.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">
                  <button className="hover:underline" onClick={() => openEdit(s)}>
                    {s.nom}
                  </button>
                  {s.contactNom && <div className="text-xs text-muted-foreground">{s.contactNom}</div>}
                </TableCell>
                <TableCell>{s.corpsDetat || '—'}</TableCell>
                <TableCell>{s.evaluation ? '★'.repeat(s.evaluation) : '—'}</TableCell>
                <TableCell>
                  <Badge variant={s.actif ? 'default' : 'secondary'}>{s.actif ? 'Actif' : 'Désactivé'}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  {s.actif ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1 text-destructive hover:text-destructive"
                      onClick={() => deactivateMutation.mutate(s.id)}
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Désactiver
                    </Button>
                  ) : (
                    <Button variant="ghost" size="sm" className="gap-1" onClick={() => reactivateMutation.mutate(s.id)}>
                      <RotateCcw className="h-3.5 w-3.5" />
                      Réactiver
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {data && <PaginationBar page={data.page} totalPages={data.totalPages} total={data.total} onPageChange={setPage} />}

      <SousTraitantFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        sousTraitant={editing}
        onSubmit={handleSubmit}
        submitting={createMutation.isPending || updateMutation.isPending}
        error={formError}
      />
    </div>
  );
}
