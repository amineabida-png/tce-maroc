import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, RotateCcw, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatMAD } from '@/lib/currency';
import { ApiError } from '@/lib/api';
import * as api from './api';
import { CompteFormDialog } from './CompteFormDialog';
import { TYPE_COMPTE_LABELS, type CompteTresorerie } from './types';

export function ComptesTab() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CompteTresorerie | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['comptes-tresorerie'],
    queryFn: () => api.fetchComptes({}),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['comptes-tresorerie'] });

  const createMutation = useMutation({
    mutationFn: api.createCompte,
    onSuccess: () => {
      invalidate();
      setDialogOpen(false);
    },
    onError: (err) => setFormError(err instanceof ApiError ? err.message : 'Erreur inattendue.'),
  });
  const updateMutation = useMutation({
    mutationFn: (vars: { id: string; values: api.CompteFormValues }) => api.updateCompte(vars.id, vars.values),
    onSuccess: () => {
      invalidate();
      setDialogOpen(false);
    },
    onError: (err) => setFormError(err instanceof ApiError ? err.message : 'Erreur inattendue.'),
  });
  const deactivateMutation = useMutation({ mutationFn: api.deactivateCompte, onSuccess: invalidate });
  const reactivateMutation = useMutation({ mutationFn: api.reactivateCompte, onSuccess: invalidate });

  function openCreate() {
    setEditing(null);
    setFormError(null);
    setDialogOpen(true);
  }
  function openEdit(c: CompteTresorerie) {
    setEditing(c);
    setFormError(null);
    setDialogOpen(true);
  }
  async function handleSubmit(values: api.CompteFormValues) {
    setFormError(null);
    if (editing) await updateMutation.mutateAsync({ id: editing.id, values });
    else await createMutation.mutateAsync(values);
  }

  const totalSolde = (data?.items ?? []).reduce((sum, c) => sum + c.solde, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Trésorerie totale : <span className="font-semibold text-foreground">{formatMAD(totalSolde)}</span>
        </p>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Nouveau compte
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Compte</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Banque</TableHead>
              <TableHead className="text-right">Solde</TableHead>
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
                  Aucun compte.
                </TableCell>
              </TableRow>
            )}
            {data?.items.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">
                  <button className="hover:underline" onClick={() => openEdit(c)}>
                    {c.nom}
                  </button>
                </TableCell>
                <TableCell>{TYPE_COMPTE_LABELS[c.type]}</TableCell>
                <TableCell>{c.banque || '—'}</TableCell>
                <TableCell className={`text-right font-medium ${c.solde < 0 ? 'text-destructive' : ''}`}>{formatMAD(c.solde)}</TableCell>
                <TableCell className="text-right">
                  {c.actif ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1 text-destructive hover:text-destructive"
                      onClick={() => deactivateMutation.mutate(c.id)}
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Désactiver
                    </Button>
                  ) : (
                    <Button variant="ghost" size="sm" className="gap-1" onClick={() => reactivateMutation.mutate(c.id)}>
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

      <CompteFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        compte={editing}
        onSubmit={handleSubmit}
        submitting={createMutation.isPending || updateMutation.isPending}
        error={formError}
      />
    </div>
  );
}
