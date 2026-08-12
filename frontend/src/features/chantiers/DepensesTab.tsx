import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatMAD } from '@/lib/currency';
import { formatDate } from '@/lib/date';
import { ApiError } from '@/lib/api';
import * as api from './api';
import { DepenseFormDialog } from './DepenseFormDialog';
import { CATEGORIE_DEPENSE_LABELS } from './types';

export function DepensesTab({ chantierId }: { chantierId: string }) {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const { data: depenses = [] } = useQuery({
    queryKey: ['chantier', chantierId, 'depenses'],
    queryFn: () => api.fetchDepenses(chantierId),
  });
  const { data: budget } = useQuery({
    queryKey: ['chantier', chantierId, 'budget'],
    queryFn: () => api.fetchBudgetSummary(chantierId),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['chantier', chantierId, 'depenses'] });
    queryClient.invalidateQueries({ queryKey: ['chantier', chantierId, 'budget'] });
  };

  const createMutation = useMutation({
    mutationFn: (values: api.DepenseFormValues) => api.createDepense(chantierId, values),
    onSuccess: () => {
      invalidate();
      setDialogOpen(false);
    },
    onError: (err) => setFormError(err instanceof ApiError ? err.message : 'Erreur inattendue.'),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteDepense(chantierId, id),
    onSuccess: invalidate,
  });

  const ecartNegatif = budget?.ecart !== null && budget?.ecart !== undefined && budget.ecart < 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Budget prévisionnel</CardTitle>
          </CardHeader>
          <CardContent className="text-xl font-semibold">
            {budget?.budgetPrevisionnel != null ? formatMAD(budget.budgetPrevisionnel) : '—'}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Dépenses réelles</CardTitle>
          </CardHeader>
          <CardContent className="text-xl font-semibold">{formatMAD(budget?.totalReel ?? 0)}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Écart</CardTitle>
          </CardHeader>
          <CardContent className={`text-xl font-semibold ${ecartNegatif ? 'text-destructive' : ''}`}>
            {budget?.ecart != null ? formatMAD(budget.ecart) : '—'}
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="font-medium">Dépenses</h3>
        <Button
          size="sm"
          className="gap-2"
          onClick={() => {
            setFormError(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Nouvelle dépense
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Catégorie</TableHead>
              <TableHead>Fournisseur / Sous-traitant</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Montant</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {depenses.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Aucune dépense enregistrée.
                </TableCell>
              </TableRow>
            )}
            {depenses.map((d) => (
              <TableRow key={d.id}>
                <TableCell>{formatDate(d.date)}</TableCell>
                <TableCell>{CATEGORIE_DEPENSE_LABELS[d.categorie]}</TableCell>
                <TableCell>{d.fournisseur?.nom || d.sousTraitant?.nom || '—'}</TableCell>
                <TableCell className="text-muted-foreground">{d.description || '—'}</TableCell>
                <TableCell className="text-right font-medium">{formatMAD(d.montant)}</TableCell>
                <TableCell>
                  <button className="text-muted-foreground hover:text-destructive" onClick={() => deleteMutation.mutate(d.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <DepenseFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={(values) => createMutation.mutateAsync(values)}
        submitting={createMutation.isPending}
        error={formError}
      />
    </div>
  );
}
