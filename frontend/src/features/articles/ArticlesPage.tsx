import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Plus, RotateCcw, Search, XCircle } from 'lucide-react';
import { PaginationBar } from '@/components/PaginationBar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatMAD } from '@/lib/currency';
import { ApiError } from '@/lib/api';
import * as api from './api';
import { ArticleFormDialog } from './ArticleFormDialog';
import type { Article } from './types';

export default function ArticlesPage() {
  const queryClient = useQueryClient();
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [sousSeuilOnly, setSousSeuilOnly] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Article | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['articles', q, page, sousSeuilOnly],
    queryFn: () => api.fetchArticles({ q, page, sousSeuil: sousSeuilOnly }),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['articles'] });

  const createMutation = useMutation({
    mutationFn: api.createArticle,
    onSuccess: () => {
      invalidate();
      setDialogOpen(false);
    },
    onError: (err) => setFormError(err instanceof ApiError ? err.message : 'Erreur inattendue.'),
  });
  const updateMutation = useMutation({
    mutationFn: (vars: { id: string; values: api.ArticleFormValues }) => api.updateArticle(vars.id, vars.values),
    onSuccess: () => {
      invalidate();
      setDialogOpen(false);
    },
    onError: (err) => setFormError(err instanceof ApiError ? err.message : 'Erreur inattendue.'),
  });
  const deactivateMutation = useMutation({ mutationFn: api.deactivateArticle, onSuccess: invalidate });
  const reactivateMutation = useMutation({ mutationFn: api.reactivateArticle, onSuccess: invalidate });

  function openCreate() {
    setEditing(null);
    setFormError(null);
    setDialogOpen(true);
  }
  function openEdit(a: Article) {
    setEditing(a);
    setFormError(null);
    setDialogOpen(true);
  }
  async function handleSubmit(values: api.ArticleFormValues) {
    setFormError(null);
    if (editing) await updateMutation.mutateAsync({ id: editing.id, values });
    else await createMutation.mutateAsync(values);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Articles & Stock</h1>
          <p className="text-muted-foreground">Niveau de stock et valorisation calculés depuis les mouvements réels.</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Nouvel article
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-72 max-w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher (nom, catégorie)…"
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
            checked={sousSeuilOnly}
            onChange={(e) => {
              setSousSeuilOnly(e.target.checked);
              setPage(1);
            }}
          />
          Sous le seuil d'alerte uniquement
        </label>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Article</TableHead>
              <TableHead>Catégorie</TableHead>
              <TableHead className="text-right">En stock</TableHead>
              <TableHead className="text-right">CMP</TableHead>
              <TableHead className="text-right">Valorisation</TableHead>
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
                  Aucun article.
                </TableCell>
              </TableRow>
            )}
            {data?.items.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="font-medium">
                  <button className="hover:underline" onClick={() => openEdit(a)}>
                    {a.nom}
                  </button>
                </TableCell>
                <TableCell>{a.categorie || '—'}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {a.stock.sousLeSeuil && <AlertTriangle className="h-3.5 w-3.5 text-destructive" />}
                    <span className={a.stock.sousLeSeuil ? 'font-medium text-destructive' : ''}>
                      {a.stock.quantiteEnStock} {a.unite}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right">{formatMAD(a.stock.coutMoyenPondere)}</TableCell>
                <TableCell className="text-right">{formatMAD(a.stock.valorisation)}</TableCell>
                <TableCell className="text-right">
                  {a.actif ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1 text-destructive hover:text-destructive"
                      onClick={() => deactivateMutation.mutate(a.id)}
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Désactiver
                    </Button>
                  ) : (
                    <Button variant="ghost" size="sm" className="gap-1" onClick={() => reactivateMutation.mutate(a.id)}>
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

      <ArticleFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        article={editing}
        onSubmit={handleSubmit}
        submitting={createMutation.isPending || updateMutation.isPending}
        error={formError}
      />
    </div>
  );
}
