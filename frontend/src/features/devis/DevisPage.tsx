import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PaginationBar } from '@/components/PaginationBar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SelectNative } from '@/components/ui/select-native';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDate } from '@/lib/date';
import { formatMAD } from '@/lib/currency';
import * as api from './api';
import { STATUT_DEVIS_LABELS, STATUT_DEVIS_VARIANT } from './types';

export default function DevisPage() {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [statut, setStatut] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['devis-list', q, statut, page],
    queryFn: () => api.fetchDevisList({ q, page, statut: statut || undefined }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Devis</h1>
          <p className="text-muted-foreground">Devis détaillés par lots, calcul HT/TVA/TTC automatique.</p>
        </div>
        <Button className="gap-2" onClick={() => navigate('/devis/nouveau')}>
          <Plus className="h-4 w-4" />
          Nouveau devis
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-72 max-w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher (numéro, client)…"
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
          {Object.entries(STATUT_DEVIS_LABELS).map(([value, label]) => (
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
              <TableHead>N°</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Total TTC</TableHead>
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
                  Aucun devis.
                </TableCell>
              </TableRow>
            )}
            {data?.items.map((d) => (
              <TableRow key={d.id} className="cursor-pointer" onClick={() => navigate(`/devis/${d.id}`)}>
                <TableCell className="font-medium">{d.numero}</TableCell>
                <TableCell>{d.client.nom}</TableCell>
                <TableCell>{formatDate(d.date)}</TableCell>
                <TableCell className="text-right">{formatMAD(d.totaux.montantTTC)}</TableCell>
                <TableCell>
                  <Badge variant={STATUT_DEVIS_VARIANT[d.statut]}>{STATUT_DEVIS_LABELS[d.statut]}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {data && <PaginationBar page={data.page} totalPages={data.totalPages} total={data.total} onPageChange={setPage} />}
    </div>
  );
}
