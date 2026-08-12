import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ApiError } from '@/lib/api';
import { formatMAD } from '@/lib/currency';
import * as api from './api';

export function ImpayesTab() {
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['reporting-impayes'],
    queryFn: () => api.fetchImpayes(),
  });

  async function handleExport() {
    setExportError(null);
    setExporting(true);
    try {
      await api.exportImpayes();
    } catch (err) {
      setExportError(err instanceof ApiError ? err.message : 'Erreur inattendue.');
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Card className="w-64">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total créances clients</CardTitle>
          </CardHeader>
          <CardContent className="text-xl font-semibold">{formatMAD(data?.total ?? 0)}</CardContent>
        </Card>
        <div className="space-y-1.5">
          <Button variant="outline" className="gap-2" onClick={handleExport} disabled={exporting}>
            <Download className="h-4 w-4" />
            {exporting ? 'Export…' : 'Exporter CSV'}
          </Button>
          {exportError && <p className="text-sm text-destructive">{exportError}</p>}
        </div>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead className="text-right">Factures impayées</TableHead>
              <TableHead className="text-right">Montant restant dû</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                  Chargement…
                </TableCell>
              </TableRow>
            )}
            {!isLoading && data?.lignes.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                  Aucune créance en cours.
                </TableCell>
              </TableRow>
            )}
            {data?.lignes.map((l) => (
              <TableRow key={l.clientId}>
                <TableCell className="font-medium">{l.clientNom}</TableCell>
                <TableCell className="text-right">{l.nombreFactures}</TableCell>
                <TableCell className="text-right font-medium">{formatMAD(l.montantRestant)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
