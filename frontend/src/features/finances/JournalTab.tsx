import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { SelectNative } from '@/components/ui/select-native';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { apiFetch } from '@/lib/api';
import { formatMAD } from '@/lib/currency';
import { formatDate } from '@/lib/date';
import * as api from './api';
import { SENS_LABELS, type CompteTresorerie } from './types';

function firstOfMonth(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}
function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function JournalTab() {
  const [compteId, setCompteId] = useState('');
  const [debut, setDebut] = useState(firstOfMonth());
  const [fin, setFin] = useState(today());

  const { data: comptes } = useQuery({
    queryKey: ['comptes-options'],
    queryFn: () => apiFetch<{ items: CompteTresorerie[] }>('/api/comptes-tresorerie?pageSize=100'),
  });
  const { data: journal, isLoading } = useQuery({
    queryKey: ['journal-tresorerie', compteId, debut, fin],
    queryFn: () => api.fetchJournal({ compteId: compteId || undefined, debut, fin }),
  });

  const totalEncaissements = (journal ?? []).filter((e) => e.sens === 'ENCAISSEMENT').reduce((s, e) => s + e.montant, 0);
  const totalDecaissements = (journal ?? []).filter((e) => e.sens === 'DECAISSEMENT').reduce((s, e) => s + e.montant, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <label className="text-sm text-muted-foreground">Compte</label>
          <SelectNative className="w-56" value={compteId} onChange={(e) => setCompteId(e.target.value)}>
            <option value="">Tous les comptes</option>
            {comptes?.items.map((c) => (
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
        <p className="pb-2 text-sm text-muted-foreground">
          Encaissements : <span className="font-medium text-foreground">{formatMAD(totalEncaissements)}</span> — Décaissements :{' '}
          <span className="font-medium text-foreground">{formatMAD(totalDecaissements)}</span>
        </p>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Sens</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Mode</TableHead>
              <TableHead className="text-right">Montant</TableHead>
              <TableHead className="text-right">Rapproché</TableHead>
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
            {!isLoading && journal?.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Aucun mouvement sur cette période.
                </TableCell>
              </TableRow>
            )}
            {journal?.map((entry) => (
              <TableRow key={`${entry.source}-${entry.id}`}>
                <TableCell>{formatDate(entry.date)}</TableCell>
                <TableCell>
                  <Badge variant={entry.sens === 'ENCAISSEMENT' ? 'default' : 'secondary'}>{SENS_LABELS[entry.sens]}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{entry.description}</TableCell>
                <TableCell className="text-muted-foreground">{entry.modePaiement || '—'}</TableCell>
                <TableCell className="text-right font-medium">{formatMAD(entry.montant)}</TableCell>
                <TableCell className="text-right">{entry.rapproche == null ? '—' : entry.rapproche ? 'Oui' : 'Non'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
