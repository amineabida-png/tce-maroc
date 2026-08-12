import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Plus, Trash2 } from 'lucide-react';
import { PaginationBar } from '@/components/PaginationBar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SelectNative } from '@/components/ui/select-native';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { apiFetch, ApiError } from '@/lib/api';
import { formatMAD } from '@/lib/currency';
import { formatDate } from '@/lib/date';
import * as api from './api';
import { MouvementFormDialog } from './MouvementFormDialog';
import { MODE_PAIEMENT_LABELS, SENS_LABELS, STATUT_MOUVEMENT_LABELS, type CompteTresorerie } from './types';

export function MouvementsTab() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [compteId, setCompteId] = useState('');
  const [sens, setSens] = useState('');
  const [statut, setStatut] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const { data: comptes } = useQuery({
    queryKey: ['comptes-options'],
    queryFn: () => apiFetch<{ items: CompteTresorerie[] }>('/api/comptes-tresorerie?pageSize=100'),
  });
  const { data, isLoading } = useQuery({
    queryKey: ['mouvements-tresorerie', page, compteId, sens, statut],
    queryFn: () => api.fetchMouvements({ page, compteId: compteId || undefined, sens: sens || undefined, statut: statut || undefined }),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['mouvements-tresorerie'] });
    queryClient.invalidateQueries({ queryKey: ['comptes-tresorerie'] });
    queryClient.invalidateQueries({ queryKey: ['comptes-options'] });
  };

  const createMutation = useMutation({
    mutationFn: api.createMouvement,
    onSuccess: () => {
      invalidate();
      setDialogOpen(false);
    },
    onError: (err) => setFormError(err instanceof ApiError ? err.message : 'Erreur inattendue.'),
  });
  const deleteMutation = useMutation({ mutationFn: api.deleteMouvement, onSuccess: invalidate });
  const rapprocherMutation = useMutation({
    mutationFn: (vars: { id: string; rapproche: boolean }) => api.rapprocherMouvement(vars.id, vars.rapproche),
    onSuccess: invalidate,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <SelectNative
            className="w-52"
            value={compteId}
            onChange={(e) => {
              setCompteId(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Tous les comptes</option>
            {comptes?.items.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nom}
              </option>
            ))}
          </SelectNative>
          <SelectNative
            className="w-44"
            value={sens}
            onChange={(e) => {
              setSens(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Tous les sens</option>
            {Object.entries(SENS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </SelectNative>
          <SelectNative
            className="w-40"
            value={statut}
            onChange={(e) => {
              setStatut(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Tous les statuts</option>
            {Object.entries(STATUT_MOUVEMENT_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </SelectNative>
        </div>
        <Button
          className="gap-2"
          onClick={() => {
            setFormError(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Nouveau mouvement
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Compte</TableHead>
              <TableHead>Sens</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Montant</TableHead>
              <TableHead className="text-right">Rapproché</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  Chargement…
                </TableCell>
              </TableRow>
            )}
            {!isLoading && data?.items.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  Aucun mouvement.
                </TableCell>
              </TableRow>
            )}
            {data?.items.map((m) => (
              <TableRow key={m.id}>
                <TableCell>{formatDate(m.date)}</TableCell>
                <TableCell>{m.compte.nom}</TableCell>
                <TableCell>
                  <Badge variant={m.sens === 'ENCAISSEMENT' ? 'default' : 'secondary'}>{SENS_LABELS[m.sens]}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {m.description || m.fournisseur?.nom || m.sousTraitant?.nom || m.chantier?.nom || '—'}
                  <span className="ml-1 text-xs">({MODE_PAIEMENT_LABELS[m.modePaiement]})</span>
                </TableCell>
                <TableCell>
                  <Badge variant={m.statut === 'REALISE' ? 'outline' : 'secondary'}>{STATUT_MOUVEMENT_LABELS[m.statut]}</Badge>
                </TableCell>
                <TableCell className="text-right font-medium">{formatMAD(m.montant)}</TableCell>
                <TableCell className="text-right">
                  {m.statut === 'REALISE' ? (
                    <button
                      className={`inline-flex items-center gap-1 text-xs ${m.rapproche ? 'text-green-600' : 'text-muted-foreground hover:text-foreground'}`}
                      onClick={() => rapprocherMutation.mutate({ id: m.id, rapproche: !m.rapproche })}
                    >
                      <Check className="h-3.5 w-3.5" />
                      {m.rapproche ? 'Oui' : 'Non'}
                    </button>
                  ) : (
                    '—'
                  )}
                </TableCell>
                <TableCell>
                  {!m.rapproche && (
                    <button className="text-muted-foreground hover:text-destructive" onClick={() => deleteMutation.mutate(m.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {data && <PaginationBar page={data.page} totalPages={data.totalPages} total={data.total} onPageChange={setPage} />}

      <MouvementFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={(values) => createMutation.mutateAsync(values)}
        submitting={createMutation.isPending}
        error={formError}
        defaultCompteId={compteId}
      />
    </div>
  );
}
