import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PaginationBar } from '@/components/PaginationBar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { SelectNative } from '@/components/ui/select-native';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatMAD } from '@/lib/currency';
import { ApiError } from '@/lib/api';
import * as api from './api';
import { ChantierFormDialog } from './ChantierFormDialog';
import { STATUT_CHANTIER_LABELS, STATUT_CHANTIER_VARIANT } from './types';

export default function ChantiersPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [q, setQ] = useState('');
  const [statut, setStatut] = useState('');
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['chantiers', q, statut, page],
    queryFn: () => api.fetchChantiers({ q, page, statut: statut || undefined }),
  });

  const createMutation = useMutation({
    mutationFn: api.createChantier,
    onSuccess: (chantier) => {
      queryClient.invalidateQueries({ queryKey: ['chantiers'] });
      setDialogOpen(false);
      navigate(`/chantiers/${chantier.id}`);
    },
    onError: (err) => setFormError(err instanceof ApiError ? err.message : 'Erreur inattendue.'),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Chantiers</h1>
          <p className="text-muted-foreground">Suivi des projets en cours, budget et avancement.</p>
        </div>
        <Button
          className="gap-2"
          onClick={() => {
            setFormError(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Nouveau chantier
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-72 max-w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher (nom, ville)…"
            className="pl-9"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <SelectNative
          className="w-52"
          value={statut}
          onChange={(e) => {
            setStatut(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Tous les statuts</option>
          {Object.entries(STATUT_CHANTIER_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </SelectNative>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Chantier</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Budget prévisionnel</TableHead>
              <TableHead>Avancement</TableHead>
              <TableHead>Statut</TableHead>
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
                  Aucun chantier.
                </TableCell>
              </TableRow>
            )}
            {data?.items.map((c) => (
              <TableRow key={c.id} className="cursor-pointer" onClick={() => navigate(`/chantiers/${c.id}`)}>
                <TableCell className="font-medium">
                  {c.nom}
                  {c.ville && <div className="text-xs text-muted-foreground">{c.ville}</div>}
                </TableCell>
                <TableCell>{c.client?.nom || '—'}</TableCell>
                <TableCell>{c.budgetPrevisionnel ? formatMAD(c.budgetPrevisionnel) : '—'}</TableCell>
                <TableCell className="w-40">
                  <div className="flex items-center gap-2">
                    <Progress value={c.avancement} className="w-24" />
                    <span className="text-xs text-muted-foreground">{c.avancement}%</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={STATUT_CHANTIER_VARIANT[c.statut]}>{STATUT_CHANTIER_LABELS[c.statut]}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {data && <PaginationBar page={data.page} totalPages={data.totalPages} total={data.total} onPageChange={setPage} />}

      <ChantierFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        chantier={null}
        onSubmit={(values) => createMutation.mutateAsync(values)}
        submitting={createMutation.isPending}
        error={formError}
      />
    </div>
  );
}
