import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, Truck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PaginationBar } from '@/components/PaginationBar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDate } from '@/lib/date';
import * as api from './api';

export default function BonsLivraisonPage() {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['bons-livraison-list', q, page],
    queryFn: () => api.fetchList({ q, page }),
  });
  const { data: resume } = useQuery({
    queryKey: ['bons-livraison-resume'],
    queryFn: () => api.fetchResume(),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Bons de livraison</h1>
          <p className="text-muted-foreground">Constat des livraisons remises aux clients — sans TVA, preuve de réception.</p>
        </div>
        <Button className="gap-2" onClick={() => navigate('/bons-livraison/nouveau')}>
          <Plus className="h-4 w-4" />
          Nouveau bon de livraison
        </Button>
      </div>

      {resume && resume.total > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:max-w-md">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Truck className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Bons de livraison</p>
                <p className="text-xl font-semibold leading-tight">{resume.total}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-medium text-muted-foreground">30 derniers jours</p>
              <p className="text-xl font-semibold leading-tight">{resume.recents}</p>
            </CardContent>
          </Card>
        </div>
      )}

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

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>N°</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Chantier</TableHead>
              <TableHead>Date</TableHead>
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
                  Aucun bon de livraison.
                </TableCell>
              </TableRow>
            )}
            {data?.items.map((bl) => (
              <TableRow key={bl.id} className="cursor-pointer" onClick={() => navigate(`/bons-livraison/${bl.id}`)}>
                <TableCell className="font-medium">{bl.numero}</TableCell>
                <TableCell>{bl.client.nom}</TableCell>
                <TableCell>{bl.chantier?.nom ?? '—'}</TableCell>
                <TableCell>{formatDate(bl.date)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {data && <PaginationBar page={data.page} totalPages={data.totalPages} total={data.total} onPageChange={setPage} />}
    </div>
  );
}
