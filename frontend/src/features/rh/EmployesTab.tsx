import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Banknote, Download, Plus, RotateCcw, Search, Users, XCircle } from 'lucide-react';
import { PaginationBar } from '@/components/PaginationBar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatMAD } from '@/lib/currency';
import { today } from '@/lib/date';
import { ApiError } from '@/lib/api';
import * as api from './api';
import { EmployeFormDialog } from './EmployeFormDialog';
import { TYPE_CONTRAT_LABELS, type Employe } from './types';

function firstOfMonth(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

export function EmployesTab() {
  const queryClient = useQueryClient();
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Employe | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [paieDebut, setPaieDebut] = useState(firstOfMonth());
  const [paieFin, setPaieFin] = useState(today());
  const [paieError, setPaieError] = useState<string | null>(null);
  const [paieLoading, setPaieLoading] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['employes', q, page],
    queryFn: () => api.fetchEmployes({ q, page }),
  });
  const { data: resume } = useQuery({
    queryKey: ['employes-resume'],
    queryFn: () => api.fetchResumeEmployes(),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['employes'] });
    queryClient.invalidateQueries({ queryKey: ['employes-resume'] });
  };

  const createMutation = useMutation({
    mutationFn: api.createEmploye,
    onSuccess: () => {
      invalidate();
      setDialogOpen(false);
    },
    onError: (err) => setFormError(err instanceof ApiError ? err.message : 'Erreur inattendue.'),
  });
  const updateMutation = useMutation({
    mutationFn: (vars: { id: string; values: api.EmployeFormValues }) => api.updateEmploye(vars.id, vars.values),
    onSuccess: () => {
      invalidate();
      setDialogOpen(false);
    },
    onError: (err) => setFormError(err instanceof ApiError ? err.message : 'Erreur inattendue.'),
  });
  const deactivateMutation = useMutation({ mutationFn: api.deactivateEmploye, onSuccess: invalidate });
  const reactivateMutation = useMutation({ mutationFn: api.reactivateEmploye, onSuccess: invalidate });

  function openCreate() {
    setEditing(null);
    setFormError(null);
    setDialogOpen(true);
  }
  function openEdit(e: Employe) {
    setEditing(e);
    setFormError(null);
    setDialogOpen(true);
  }
  async function handleSubmit(values: api.EmployeFormValues) {
    setFormError(null);
    if (editing) await updateMutation.mutateAsync({ id: editing.id, values });
    else await createMutation.mutateAsync(values);
  }

  async function handleExportPaie() {
    setPaieError(null);
    setPaieLoading(true);
    try {
      await api.exportPaie(paieDebut, paieFin);
    } catch (err) {
      setPaieError(err instanceof ApiError ? err.message : 'Erreur inattendue.');
    } finally {
      setPaieLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3 rounded-lg border p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <label className="text-sm text-muted-foreground">Du</label>
            <Input type="date" value={paieDebut} onChange={(e) => setPaieDebut(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm text-muted-foreground">Au</label>
            <Input type="date" value={paieFin} onChange={(e) => setPaieFin(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Button variant="outline" className="gap-2" onClick={handleExportPaie} disabled={paieLoading}>
            <Download className="h-4 w-4" />
            {paieLoading ? 'Export…' : 'Exporter la paie (CSV)'}
          </Button>
          {paieError && <p className="text-sm text-destructive">{paieError}</p>}
        </div>
      </div>

      {resume && resume.total > 0 && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Employés actifs</p>
                <p className="text-xl font-semibold leading-tight">{resume.total}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-medium text-muted-foreground">CDI</p>
              <p className="text-xl font-semibold leading-tight">
                {resume.parTypeContrat.find((t) => t.typeContrat === 'CDI')?.nombre ?? 0}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-medium text-muted-foreground">CDD</p>
              <p className="text-xl font-semibold leading-tight">
                {resume.parTypeContrat.find((t) => t.typeContrat === 'CDD')?.nombre ?? 0}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                <Banknote className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Taux horaire moyen</p>
                <p className="text-xl font-semibold leading-tight">
                  {resume.tauxHoraireMoyen !== null ? formatMAD(resume.tauxHoraireMoyen) : '—'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="relative w-72 max-w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher (nom, poste)…"
            className="pl-9"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Nouvel employé
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employé</TableHead>
              <TableHead>Poste</TableHead>
              <TableHead>Contrat</TableHead>
              <TableHead className="text-right">Taux horaire</TableHead>
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
                  Aucun employé.
                </TableCell>
              </TableRow>
            )}
            {data?.items.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="font-medium">
                  <button className="hover:underline" onClick={() => openEdit(e)}>
                    {e.nom} {e.prenom}
                  </button>
                </TableCell>
                <TableCell>{e.poste || '—'}</TableCell>
                <TableCell>{TYPE_CONTRAT_LABELS[e.typeContrat]}</TableCell>
                <TableCell className="text-right">{e.tauxHoraire ? formatMAD(e.tauxHoraire) : '—'}</TableCell>
                <TableCell className="text-right">
                  {e.actif ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1 text-destructive hover:text-destructive"
                      onClick={() => deactivateMutation.mutate(e.id)}
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Désactiver
                    </Button>
                  ) : (
                    <Button variant="ghost" size="sm" className="gap-1" onClick={() => reactivateMutation.mutate(e.id)}>
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

      <EmployeFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        employe={editing}
        onSubmit={handleSubmit}
        submitting={createMutation.isPending || updateMutation.isPending}
        error={formError}
      />
    </div>
  );
}
