import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { SelectNative } from '@/components/ui/select-native';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { apiFetch } from '@/lib/api';
import { formatMAD } from '@/lib/currency';
import { today } from '@/lib/date';
import * as api from './api';

interface ChantierOption {
  id: string;
  nom: string;
}

function firstOfMonth(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

export function CoutMainDoeuvreTab() {
  const [chantierId, setChantierId] = useState('');
  const [debut, setDebut] = useState(firstOfMonth());
  const [fin, setFin] = useState(today());

  const { data: chantiersData } = useQuery({
    queryKey: ['chantiers-options'],
    queryFn: () => apiFetch<{ items: ChantierOption[] }>('/api/chantiers?pageSize=100'),
  });
  const { data: cout, isLoading } = useQuery({
    queryKey: ['cout-main-doeuvre', chantierId, debut, fin],
    queryFn: () => api.fetchCoutMainDoeuvre(chantierId, debut, fin),
    enabled: Boolean(chantierId),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <label className="text-sm text-muted-foreground">Chantier</label>
          <SelectNative className="w-56" value={chantierId} onChange={(e) => setChantierId(e.target.value)}>
            <option value="">— Choisir un chantier —</option>
            {chantiersData?.items.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nom}
              </option>
            ))}
          </SelectNative>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm text-muted-foreground">Du</label>
          <Input type="date" value={debut} onChange={(e) => setDebut(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm text-muted-foreground">Au</label>
          <Input type="date" value={fin} onChange={(e) => setFin(e.target.value)} />
        </div>
      </div>

      {!chantierId && <p className="text-muted-foreground">Choisissez un chantier pour voir le coût de main-d'œuvre.</p>}

      {chantierId && isLoading && <p className="text-muted-foreground">Chargement…</p>}

      {chantierId && cout && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total heures</CardTitle>
              </CardHeader>
              <CardContent className="text-xl font-semibold">{cout.totalHeures} h</CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Coût total</CardTitle>
              </CardHeader>
              <CardContent className="text-xl font-semibold">{formatMAD(cout.totalCout)}</CardContent>
            </Card>
          </div>

          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employé</TableHead>
                  <TableHead className="text-right">Heures</TableHead>
                  <TableHead className="text-right">Coût</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cout.parEmploye.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      Aucun pointage présent sur cette période.
                    </TableCell>
                  </TableRow>
                )}
                {cout.parEmploye.map((p) => (
                  <TableRow key={p.employeId}>
                    <TableCell className="font-medium">
                      {p.nom} {p.prenom}
                    </TableCell>
                    <TableCell className="text-right">{p.heures} h</TableCell>
                    <TableCell className="text-right">{formatMAD(p.cout)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
