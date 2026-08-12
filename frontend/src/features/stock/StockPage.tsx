import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowDownCircle, ArrowUpCircle, Plus } from 'lucide-react';
import { PaginationBar } from '@/components/PaginationBar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDate } from '@/lib/date';
import { ApiError } from '@/lib/api';
import * as api from './api';
import { SortieFormDialog } from './SortieFormDialog';

export default function StockPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['mouvements-stock', page],
    queryFn: () => api.fetchMouvements({ page }),
  });

  const sortieMutation = useMutation({
    mutationFn: api.createSortie,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mouvements-stock'] });
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      setDialogOpen(false);
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Erreur inattendue.'),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Mouvements de stock</h1>
          <p className="text-muted-foreground">Historique des entrées (réceptions) et sorties (consommation chantier).</p>
        </div>
        <Button
          className="gap-2"
          onClick={() => {
            setError(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Nouvelle sortie
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Article</TableHead>
              <TableHead className="text-right">Quantité</TableHead>
              <TableHead>Chantier</TableHead>
              <TableHead>Notes</TableHead>
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
                  Aucun mouvement.
                </TableCell>
              </TableRow>
            )}
            {data?.items.map((m) => (
              <TableRow key={m.id}>
                <TableCell>{formatDate(m.date)}</TableCell>
                <TableCell>
                  <Badge variant={m.type === 'ENTREE' ? 'default' : 'secondary'} className="gap-1">
                    {m.type === 'ENTREE' ? <ArrowDownCircle className="h-3 w-3" /> : <ArrowUpCircle className="h-3 w-3" />}
                    {m.type === 'ENTREE' ? 'Entrée' : 'Sortie'}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium">{m.article.nom}</TableCell>
                <TableCell className="text-right">
                  {m.quantite} {m.article.unite}
                </TableCell>
                <TableCell>{m.chantier?.nom || '—'}</TableCell>
                <TableCell className="text-muted-foreground">{m.notes || '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {data && <PaginationBar page={data.page} totalPages={data.totalPages} total={data.total} onPageChange={setPage} />}

      <SortieFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={(values) => sortieMutation.mutateAsync(values)}
        submitting={sortieMutation.isPending}
        error={error}
      />
    </div>
  );
}
