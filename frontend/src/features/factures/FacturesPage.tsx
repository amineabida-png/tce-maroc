import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Clock, Plus, Receipt, Search, Wallet } from 'lucide-react';
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
import * as reportingApi from '@/features/reporting/api';
import * as api from './api';
import { STATUT_FACTURE_LABELS, STATUT_FACTURE_VARIANT } from './types';

export default function FacturesPage() {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [statut, setStatut] = useState('');
  const [impayeesOnly, setImpayeesOnly] = useState(false);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['factures-list', q, statut, impayeesOnly, page],
    queryFn: () => api.fetchFacturesList({ q, page, statut: statut || undefined, impayees: impayeesOnly }),
  });
  // Réutilise le module Reporting (aucun params = totaux toutes périodes)
  // plutôt que de dupliquer le calcul de chiffre d'affaires ici.
  const { data: ca } = useQuery({
    queryKey: ['reporting-ca-all'],
    queryFn: () => reportingApi.fetchCA({}),
  });
  const { data: impayes } = useQuery({
    queryKey: ['reporting-impayes-all'],
    queryFn: () => reportingApi.fetchImpayes(),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Factures</h1>
          <p className="text-muted-foreground">Facturation, retenue de garantie, suivi des encaissements.</p>
        </div>
        <Button className="gap-2" onClick={() => navigate('/factures/nouveau')}>
          <Plus className="h-4 w-4" />
          Nouvelle facture
        </Button>
      </div>

      {ca && impayes && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Receipt className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground">Total facturé TTC (toutes périodes)</p>
                <p className="truncate text-xl font-semibold leading-tight">{formatMAD(ca.total.montantTTC)}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                <Wallet className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground">Encaissé</p>
                <p className="truncate text-xl font-semibold leading-tight">{formatMAD(ca.total.montantEncaisse)}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${impayes.total > 0 ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
                <Clock className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground">Créances clients</p>
                <p className="truncate text-xl font-semibold leading-tight">{formatMAD(impayes.total)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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
          {Object.entries(STATUT_FACTURE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </SelectNative>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={impayeesOnly}
            onChange={(e) => {
              setImpayeesOnly(e.target.checked);
              setPage(1);
            }}
          />
          Impayées uniquement
        </label>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>N°</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Échéance</TableHead>
              <TableHead className="text-right">Net à payer</TableHead>
              <TableHead className="text-right">Restant dû</TableHead>
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
                  Aucune facture.
                </TableCell>
              </TableRow>
            )}
            {data?.items.map((f) => (
              <TableRow key={f.id} className="cursor-pointer" onClick={() => navigate(`/factures/${f.id}`)}>
                <TableCell className="font-medium">{f.numero}</TableCell>
                <TableCell>{f.client.nom}</TableCell>
                <TableCell>{formatDate(f.dateEcheance)}</TableCell>
                <TableCell className="text-right">{formatMAD(f.totaux.montantNetAPayer)}</TableCell>
                <TableCell className={`text-right ${f.montantRestantDu > 0 ? 'font-medium text-destructive' : ''}`}>
                  {formatMAD(f.montantRestantDu)}
                </TableCell>
                <TableCell>
                  <Badge variant={f.enRetard ? 'destructive' : STATUT_FACTURE_VARIANT[f.statut]}>
                    {f.enRetard ? 'En retard' : STATUT_FACTURE_LABELS[f.statut]}
                  </Badge>
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
