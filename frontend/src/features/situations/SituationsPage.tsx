import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Banknote, FileBarChart, Plus, Search } from 'lucide-react';
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
import { STATUT_SITUATION_LABELS, STATUT_SITUATION_VARIANT } from './types';

export default function SituationsPage() {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [statut, setStatut] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['situations-list', q, statut, page],
    queryFn: () => api.fetchList({ q, page, statut: statut || undefined }),
  });
  const { data: resume } = useQuery({
    queryKey: ['situations-resume'],
    queryFn: () => api.fetchResume(),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Situations de travaux</h1>
          <p className="text-muted-foreground">Décomptes d'avancement — chantiers clients et sous-traitance.</p>
        </div>
        <Button className="gap-2" onClick={() => navigate('/situations/nouveau')}>
          <Plus className="h-4 w-4" />
          Nouvelle situation
        </Button>
      </div>

      {resume && resume.total > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:max-w-md">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FileBarChart className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Situations</p>
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
                <p className="text-xs font-medium text-muted-foreground">En attente de paiement</p>
                <p className="truncate text-xl font-semibold leading-tight">{formatMAD(resume.montantEnAttente)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-72 max-w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher (numéro)…"
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
          {Object.entries(STATUT_SITUATION_LABELS).map(([value, label]) => (
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
              <TableHead>Marché</TableHead>
              <TableHead>Chantier</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Montant situation TTC</TableHead>
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
                  Aucune situation.
                </TableCell>
              </TableRow>
            )}
            {data?.items.map((s) => {
              const marche = s.commande ? `${s.commande.numero} (${s.commande.client?.nom})` : `${s.contratSousTraitant?.numero} (${s.contratSousTraitant?.sousTraitant?.nom})`;
              return (
                <TableRow key={s.id} className="cursor-pointer" onClick={() => navigate(`/situations/${s.id}`)}>
                  <TableCell className="font-medium">
                    {s.numero} <span className="text-muted-foreground">(n°{s.numeroSituation})</span>
                  </TableCell>
                  <TableCell>{marche}</TableCell>
                  <TableCell>{s.chantier?.nom ?? '—'}</TableCell>
                  <TableCell>{formatDate(s.date)}</TableCell>
                  <TableCell className="text-right">{formatMAD(s.totaux.montantTTC)}</TableCell>
                  <TableCell>
                    <Badge variant={STATUT_SITUATION_VARIANT[s.statut]}>{STATUT_SITUATION_LABELS[s.statut]}</Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {data && <PaginationBar page={data.page} totalPages={data.totalPages} total={data.total} onPageChange={setPage} />}
    </div>
  );
}
