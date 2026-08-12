import { useQuery } from '@tanstack/react-query';
import { AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatMAD } from '@/lib/currency';
import { formatDate } from '@/lib/date';
import * as api from './api';

export function EcheancierTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['echeancier-tresorerie'],
    queryFn: () => api.fetchEcheancier(),
  });

  const totalEncaissements = (data?.encaissementsPrevus ?? []).reduce((s, e) => s + e.montant, 0);
  const totalDecaissements = (data?.decaissementsPrevus ?? []).reduce((s, m) => s + Number(m.montant), 0);

  if (isLoading || !data) return <p className="text-muted-foreground">Chargement…</p>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Encaissements à venir (clients)</CardTitle>
          </CardHeader>
          <CardContent className="text-xl font-semibold">{formatMAD(totalEncaissements)}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Décaissements planifiés</CardTitle>
          </CardHeader>
          <CardContent className="text-xl font-semibold">{formatMAD(totalDecaissements)}</CardContent>
        </Card>
      </div>

      <div>
        <h3 className="mb-2 font-medium">Factures clients non soldées</h3>
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N°</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Échéance</TableHead>
                <TableHead className="text-right">Montant restant</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.encaissementsPrevus.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Aucune échéance client à venir.
                  </TableCell>
                </TableRow>
              )}
              {data.encaissementsPrevus.map((f) => (
                <TableRow key={f.id}>
                  <TableCell className="font-medium">{f.numero}</TableCell>
                  <TableCell>{f.client}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      {f.enRetard && <AlertTriangle className="h-3.5 w-3.5 text-destructive" />}
                      <span className={f.enRetard ? 'font-medium text-destructive' : ''}>{formatDate(f.dateEcheance)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">{formatMAD(f.montant)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <div>
        <h3 className="mb-2 font-medium">Décaissements planifiés (fournisseurs, sous-traitants...)</h3>
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Échéance</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Compte</TableHead>
                <TableHead className="text-right">Montant</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.decaissementsPrevus.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Aucun décaissement planifié.
                  </TableCell>
                </TableRow>
              )}
              {data.decaissementsPrevus.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>{formatDate(m.date)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {m.description || m.fournisseur?.nom || m.sousTraitant?.nom || '—'}
                  </TableCell>
                  <TableCell>{m.compte.nom}</TableCell>
                  <TableCell className="text-right font-medium">{formatMAD(m.montant)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
