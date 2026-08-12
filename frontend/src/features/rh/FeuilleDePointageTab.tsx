import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { SelectNative } from '@/components/ui/select-native';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { apiFetch, ApiError } from '@/lib/api';
import { today } from '@/lib/date';
import * as api from './api';
import { STATUT_POINTAGE_LABELS, type Employe, type StatutPointage } from './types';

interface ChantierOption {
  id: string;
  nom: string;
}

interface RowEdit {
  statut: StatutPointage;
  nombreHeures: string;
  chantierId: string;
}

const EMPTY_ROW: RowEdit = { statut: 'PRESENT', nombreHeures: '', chantierId: '' };

export function FeuilleDePointageTab() {
  const queryClient = useQueryClient();
  const [date, setDate] = useState(today());
  const [edits, setEdits] = useState<Record<string, RowEdit>>({});
  const [savedIds, setSavedIds] = useState<Record<string, boolean>>({});
  const [rowError, setRowError] = useState<Record<string, string>>({});

  const { data: employesData } = useQuery({
    queryKey: ['employes-options'],
    queryFn: () => apiFetch<{ items: Employe[] }>('/api/employes?pageSize=100'),
  });
  const { data: chantiersData } = useQuery({
    queryKey: ['chantiers-options'],
    queryFn: () => apiFetch<{ items: ChantierOption[] }>('/api/chantiers?pageSize=100'),
  });
  const { data: pointagesData } = useQuery({
    queryKey: ['pointages', date],
    queryFn: () => api.fetchPointages({ debut: date, fin: date }),
  });

  useEffect(() => {
    const byEmploye: Record<string, RowEdit> = {};
    for (const p of pointagesData?.items ?? []) {
      byEmploye[p.employeId] = {
        statut: p.statut,
        nombreHeures: p.nombreHeures ?? '',
        chantierId: p.chantierId ?? '',
      };
    }
    setEdits(byEmploye);
  }, [pointagesData]);

  useEffect(() => {
    setSavedIds({});
    setRowError({});
  }, [date]);

  function rowValues(employeId: string): RowEdit {
    return edits[employeId] ?? EMPTY_ROW;
  }
  function setRow(employeId: string, patch: Partial<RowEdit>) {
    setEdits((prev) => ({ ...prev, [employeId]: { ...rowValues(employeId), ...patch } }));
    setSavedIds((prev) => ({ ...prev, [employeId]: false }));
  }

  const saveMutation = useMutation({
    mutationFn: (employeId: string) => {
      const row = rowValues(employeId);
      return api.upsertPointage({ employeId, date, statut: row.statut, nombreHeures: row.nombreHeures, chantierId: row.chantierId, notes: '' });
    },
    onSuccess: (_data, employeId) => {
      setSavedIds((prev) => ({ ...prev, [employeId]: true }));
      setRowError((prev) => ({ ...prev, [employeId]: '' }));
      queryClient.invalidateQueries({ queryKey: ['pointages', date] });
    },
    onError: (err, employeId) => {
      setRowError((prev) => ({ ...prev, [employeId]: err instanceof ApiError ? err.message : 'Erreur inattendue.' }));
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3">
        <div className="space-y-1.5">
          <label className="text-sm text-muted-foreground">Date</label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-48" />
        </div>
        <p className="pb-2 text-sm text-muted-foreground">
          Un nouvel enregistrement pour un employé déjà pointé ce jour corrige sa fiche.
        </p>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employé</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Heures</TableHead>
              <TableHead>Chantier</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employesData?.items.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Aucun employé actif.
                </TableCell>
              </TableRow>
            )}
            {employesData?.items.map((e) => {
              const row = rowValues(e.id);
              return (
                <TableRow key={e.id}>
                  <TableCell className="font-medium">
                    {e.nom} {e.prenom}
                  </TableCell>
                  <TableCell>
                    <SelectNative
                      className="w-36"
                      value={row.statut}
                      onChange={(ev) => setRow(e.id, { statut: ev.target.value as StatutPointage })}
                    >
                      {Object.entries(STATUT_POINTAGE_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </SelectNative>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      max="24"
                      step="0.5"
                      className="w-24"
                      disabled={row.statut !== 'PRESENT'}
                      value={row.nombreHeures}
                      onChange={(ev) => setRow(e.id, { nombreHeures: ev.target.value })}
                    />
                  </TableCell>
                  <TableCell>
                    <SelectNative
                      className="w-44"
                      value={row.chantierId}
                      onChange={(ev) => setRow(e.id, { chantierId: ev.target.value })}
                    >
                      <option value="">— Aucun —</option>
                      {chantiersData?.items.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nom}
                        </option>
                      ))}
                    </SelectNative>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {rowError[e.id] && <span className="text-xs text-destructive">{rowError[e.id]}</span>}
                      {savedIds[e.id] && <Check className="h-4 w-4 text-green-600" />}
                      <button
                        type="button"
                        className="rounded-md border px-2.5 py-1 text-xs font-medium hover:bg-accent disabled:opacity-50"
                        disabled={saveMutation.isPending}
                        onClick={() => saveMutation.mutate(e.id)}
                      >
                        Enregistrer
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
