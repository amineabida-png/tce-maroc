import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, RotateCcw, Search, XCircle } from 'lucide-react';
import { PaginationBar } from '@/components/PaginationBar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatMAD } from '@/lib/currency';
import { ApiError } from '@/lib/api';
import * as api from './api';
import { OuvrageFormDialog } from './OuvrageFormDialog';
import type { Ouvrage } from './types';

export default function OuvragesPage() {
  const queryClient = useQueryClient();
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [showInactifs, setShowInactifs] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Ouvrage | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['ouvrages', q, page, showInactifs],
    queryFn: () => api.fetchOuvrages({ q, page, includeInactifs: showInactifs }),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['ouvrages'] });

  const createMutation = useMutation({
    mutationFn: api.createOuvrage,
    onSuccess: () => {
      invalidate();
      setDialogOpen(false);
    },
    onError: (err) => setFormError(err instanceof ApiError ? err.message : 'Erreur inattendue.'),
  });
  const updateMutation = useMutation({
    mutationFn: (vars: { id: string; values: api.OuvrageFormValues }) => api.updateOuvrage(vars.id, vars.values),
    onSuccess: () => {
      invalidate();
      setDialogOpen(false);
    },
    onError: (err) => setFormError(err instanceof ApiError ? err.message : 'Erreur inattendue.'),
  });
  const deactivateMutation = useMutation({ mutationFn: api.deactivateOuvrage, onSuccess: invalidate });
  const reactivateMutation = useMutation({ mutationFn: api.reactivateOuvrage, onSuccess: invalidate });

  function openCreate() {
    setEditing(null);
    setFormError(null);
    setDialogOpen(true);
  }
  function openEdit(o: Ouvrage) {
    setEditing(o);
    setFormError(null);
    setDialogOpen(true);
  }
  async function handleSubmit(values: api.OuvrageFormValues) {
    setFormError(null);
    if (editing) await updateMutation.mutateAsync({ id: editing.id, values });
    else await createMutation.mutateAsync(values);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Bibliothèque de prix (BPU)</h1>
          <p className="text-muted-foreground">Ouvrages réutilisables par corps d'état pour accélérer la saisie des devis.</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Nouvel ouvrage
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-72 max-w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher (désignation, corps d'état)…"
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
          Afficher les ouvrages désactivés
        </label>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Corps d'état</TableHead>
              <TableHead>Désignation</TableHead>
              <TableHead>Unité</TableHead>
              <TableHead className="text-right">Prix unitaire</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Chargement…
                </TableCell>
              </TableRow>
            )}
            {!isLoading && data?.items.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Aucun ouvrage.
                </TableCell>
              </TableRow>
            )}
            {data?.items.map((o) => (
              <TableRow key={o.id}>
                <TableCell>{o.corpsDetat}</TableCell>
                <TableCell className="font-medium">
                  <button className="hover:underline" onClick={() => openEdit(o)}>
                    {o.designation}
                  </button>
                </TableCell>
                <TableCell>{o.unite}</TableCell>
                <TableCell className="text-right">{formatMAD(o.prixUnitaireDefaut)}</TableCell>
                <TableCell>
                  <Badge variant={o.actif ? 'default' : 'secondary'}>{o.actif ? 'Actif' : 'Désactivé'}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  {o.actif ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1 text-destructive hover:text-destructive"
                      onClick={() => deactivateMutation.mutate(o.id)}
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Désactiver
                    </Button>
                  ) : (
                    <Button variant="ghost" size="sm" className="gap-1" onClick={() => reactivateMutation.mutate(o.id)}>
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

      <OuvrageFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        ouvrage={editing}
        onSubmit={handleSubmit}
        submitting={createMutation.isPending || updateMutation.isPending}
        error={formError}
      />
    </div>
  );
}
