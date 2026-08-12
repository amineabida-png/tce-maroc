import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PaginationBar } from '@/components/PaginationBar';
import { SelectNative } from '@/components/ui/select-native';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDate } from '@/lib/date';
import * as api from './api';

export function JournalAuditTab() {
  const [page, setPage] = useState(1);
  const [action, setAction] = useState('');

  const { data: actions } = useQuery({
    queryKey: ['journal-audit-actions'],
    queryFn: () => api.fetchActionsDistinctes(),
  });
  const { data, isLoading } = useQuery({
    queryKey: ['journal-audit', page, action],
    queryFn: () => api.fetchJournalAudit({ page, action: action || undefined }),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <SelectNative
          className="w-64"
          value={action}
          onChange={(e) => {
            setAction(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Toutes les actions</option>
          {actions?.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </SelectNative>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Utilisateur</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Entité</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  Chargement…
                </TableCell>
              </TableRow>
            )}
            {!isLoading && data?.items.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  Aucune entrée.
                </TableCell>
              </TableRow>
            )}
            {data?.items.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell className="whitespace-nowrap text-muted-foreground">{formatDate(entry.createdAt)}</TableCell>
                <TableCell>{entry.utilisateur ? `${entry.utilisateur.prenom} ${entry.utilisateur.nom}` : 'Système'}</TableCell>
                <TableCell className="font-mono text-xs">{entry.action}</TableCell>
                <TableCell className="text-muted-foreground">{entry.entite || '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {data && <PaginationBar page={data.page} totalPages={data.totalPages} total={data.total} onPageChange={setPage} />}
    </div>
  );
}
