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
import { FournisseurFormDialog } from './FournisseurFormDialog';
import type { Fournisseur } from './types';

export default function FournisseursPage() {
  const queryClient = useQueryClient();
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [showInactifs, setShowInactifs] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Fournisseur | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['fournisseurs', q, page, showInactifs],
    queryFn: () => api.fetchFournisseurs({ q, page, includeInactifs: showInactifs }),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['fournisseurs'] });

  const createMutation = useMutation({
    mutationFn: api.createFournisseur,
    onSuccess: () => {
      invalidate();
      setDialogOpen(false);
    },
    onError: (err) => setFormError(err instanceof ApiError ? err.message : 'Erreur inattendue.'),
  });
  const updateMutation = useMutation({
    mutationFn: (vars: { id: string; values: api.FournisseurFormValues }) => api.updateFournisseur(vars.id, vars.values),
    onSuccess: () => {
      invalidate();
      setDialogOpen(false);
    },
    onError: (err) => setFormError(err instanceof ApiError ? err.message : 'Erreur inattendue.'),
  });
  const deactivateMutation = useMutation({ mutationFn: api.deactivateFournisseur, onSuccess: invalidate });
  const reactivateMutation = useMutation({ mutationFn: api.reactivateFournisseur, onSuccess: invalidate });

  function openCreate() {
    setEditing(null);
    setFormError(null);
    setDialogOpen(true);
  }
  function openEdit(f: Fournisseur) {
    setEditing(f);
    setFormError(null);
    setDialogOpen(true);
  }
  async function handleSubmit(values: api.FournisseurFormValues) {
    setFormError(null);
    if (editing) await updateMutation.mutateAsync({ id: editing.id, values });
    else await createMutation.mutateAsync(values);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Fournisseurs</h1>
          <p className="text-muted-foreground">Matériaux, location de matériel, prestataires de services.</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Nouveau fournisseur
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-72 max-w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher (nom, ICE, catégorie)…"
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
          Afficher les fournisseurs désactivés
        </label>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Catégorie</TableHead>
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
                  Aucun fournisseur.
                </TableCell>
              </TableRow>
            )}
            {data?.items.map((f) => (
              <TableRow key={f.id}>
                <TableCell className="font-medium">
                  <button className="hover:underline" onClick={() => openEdit(f)}>
                    {f.nom}
                  </button>
                  {f.contactNom && <div className="text-xs text-muted-foreground">{f.contactNom}</div>}
                </TableCell>
                <TableCell>{f.categorie || '—'}</TableCell>
                <TableCell>{f.evaluation ? '★'.repeat(f.evaluation) : '—'}</TableCell>
                <TableCell>
                  <Badge variant={f.actif ? 'default' : 'secondary'}>{f.actif ? 'Actif' : 'Désactivé'}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  {f.actif ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1 text-destructive hover:text-destructive"
                      onClick={() => deactivateMutation.mutate(f.id)}
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Désactiver
                    </Button>
                  ) : (
                    <Button variant="ghost" size="sm" className="gap-1" onClick={() => reactivateMutation.mutate(f.id)}>
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

      <FournisseurFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        fournisseur={editing}
        onSubmit={handleSubmit}
        submitting={createMutation.isPending || updateMutation.isPending}
        error={formError}
      />
    </div>
  );
}
