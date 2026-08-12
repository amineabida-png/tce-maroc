import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ApiError } from '@/lib/api';
import { formatMAD } from '@/lib/currency';
import * as api from './api';

function firstOfYear(): string {
  return new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);
}
function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function CATab() {
  const [debut, setDebut] = useState(firstOfYear());
  const [fin, setFin] = useState(today());
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['reporting-ca', debut, fin],
    queryFn: () => api.fetchCA({ debut, fin }),
  });

  async function handleExport() {
    setExportError(null);
    setExporting(true);
    try {
      await api.exportCA({ debut, fin });
    } catch (err) {
      setExportError(err instanceof ApiError ? err.message : 'Erreur inattendue.');
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <label className="text-sm text-muted-foreground">Du</label>
            <Input type="date" value={debut} onChange={(e) => setDebut(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm text-muted-foreground">Au</label>
            <Input type="date" value={fin} onChange={(e) => setFin(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Button variant="outline" className="gap-2" onClick={handleExport} disabled={exporting}>
            <Download className="h-4 w-4" />
            {exporting ? 'Export…' : 'Exporter CSV'}
          </Button>
          {exportError && <p className="text-sm text-destructive">{exportError}</p>}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">CA HT</CardTitle>
          </CardHeader>
          <CardContent className="text-xl font-semibold">{formatMAD(data?.total.montantHT ?? 0)}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">TVA</CardTitle>
          </CardHeader>
          <CardContent className="text-xl font-semibold">{formatMAD(data?.total.montantTVA ?? 0)}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">CA TTC</CardTitle>
          </CardHeader>
          <CardContent className="text-xl font-semibold">{formatMAD(data?.total.montantTTC ?? 0)}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Encaissé</CardTitle>
          </CardHeader>
          <CardContent className="text-xl font-semibold">{formatMAD(data?.total.montantEncaisse ?? 0)}</CardContent>
        </Card>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Période</TableHead>
              <TableHead className="text-right">HT</TableHead>
              <TableHead className="text-right">TVA</TableHead>
              <TableHead className="text-right">TTC</TableHead>
              <TableHead className="text-right">Encaissé</TableHead>
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
            {!isLoading && data?.lignes.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Aucune facture sur cette période.
                </TableCell>
              </TableRow>
            )}
            {data?.lignes.map((l) => (
              <TableRow key={l.periode}>
                <TableCell className="font-medium">{l.periode}</TableCell>
                <TableCell className="text-right">{formatMAD(l.montantHT)}</TableCell>
                <TableCell className="text-right">{formatMAD(l.montantTVA)}</TableCell>
                <TableCell className="text-right">{formatMAD(l.montantTTC)}</TableCell>
                <TableCell className="text-right">{formatMAD(l.montantEncaisse)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
