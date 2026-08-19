import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Banknote, HardHat, Plus, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PaginationBar } from '@/components/PaginationBar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { SelectNative } from '@/components/ui/select-native';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDate } from '@/lib/date';
import { formatMAD } from '@/lib/currency';
import * as api from './api';
import { STATUT_CST_LABELS, STATUT_CST_VARIANT } from './types';

export default function ContratsSousTraitancePage() {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [statut, setStatut] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['contrats-sous-traitance-list', q, statut, page],
    queryFn: () => api.fetchList({ q, page, statut: statut || undefined }),
  });
  const { data: resume } = useQuery({
    queryKey: ['contrats-sous-traitance-resume'],
    queryFn: () => api.fetchResume(),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Contrats de sous-traitance</h1>
          <p className="text-muted-foreground">Marchés confiés aux sous-traitants — base des situations d'avancement.</p>
        </div>
        <Button className="gap-2" onClick={() => navigate('/contrats-sous-traitance/nouveau')}>
          <Plus className="h-4 w-4" />
          Nouveau contrat
        </Button>
      </div>

      {resume && resume.total > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:max-w-md">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <HardHat className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Contrats</p>
                <p className="text-xl font-semibold leading-tight">{resume.total}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                <Banknote className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground">Montant engagé</p>
                <p className="truncate text-xl font-semibold leading-tight">{formatMAD(resume.montantEngage)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-72 max-w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher (numéro, sous-traitant)…"
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
          {Object.entries(STATUT_CST_LABELS).map(([value, label]) => (
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
              <TableHead>Sous-traitant</TableHead>
              <TableHead>Chantier</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Total TTC</TableHead>
              <TableHead>Statut</TableHead>
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
            {!isLoading && data?.items.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Aucun contrat de sous-traitance.
                </TableCell>
              </TableRow>
            )}
            {data?.items.map((c) => (
              <TableRow key={c.id} className="cursor-pointer" onClick={() => navigate(`/contrats-sous-traitance/${c.id}`)}>
                <TableCell className="font-medium">{c.numero}</TableCell>
                <TableCell>{c.sousTraitant.nom}</TableCell>
                <TableCell>{c.chantier?.nom ?? '—'}</TableCell>
                <TableCell>{formatDate(c.date)}</TableCell>
                <TableCell className="text-right">{formatMAD(c.totaux.montantTTC)}</TableCell>
                <TableCell>
                  <Badge variant={STATUT_CST_VARIANT[c.statut]}>{STATUT_CST_LABELS[c.statut]}</Badge>
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
