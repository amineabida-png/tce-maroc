import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ApiError } from '@/lib/api';
import { formatMAD } from '@/lib/currency';
import * as api from './api';

export function StockTab() {
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['reporting-stock'],
    queryFn: () => api.fetchStock(),
  });

  async function handleExport() {
    setExportError(null);
    setExporting(true);
    try {
      await api.exportStock();
    } catch (err) {
      setExportError(err instanceof ApiError ? err.message : 'Erreur inattendue.');
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end gap-3">
        <div className="space-y-1.5">
          <Button variant="outline" className="gap-2" onClick={handleExport} disabled={exporting}>
            <Download className="h-4 w-4" />
            {exporting ? 'Export…' : 'Exporter CSV'}
          </Button>
          {exportError && <p className="text-sm text-destructive">{exportError}</p>}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Valorisation totale</CardTitle>
          </CardHeader>
          <CardContent className="text-xl font-semibold">{formatMAD(data?.total.valorisationTotale ?? 0)}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Articles actifs</CardTitle>
          </CardHeader>
          <CardContent className="text-xl font-semibold">{data?.total.nombreArticles ?? 0}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Sous le seuil d'alerte</CardTitle>
          </CardHeader>
          <CardContent className={`text-xl font-semibold ${(data?.total.nombreSousSeuil ?? 0) > 0 ? 'text-destructive' : ''}`}>
            {data?.total.nombreSousSeuil ?? 0}
          </CardContent>
        </Card>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Article</TableHead>
              <TableHead>Catégorie</TableHead>
              <TableHead className="text-right">En stock</TableHead>
              <TableHead className="text-right">CMP</TableHead>
              <TableHead className="text-right">Valorisation</TableHead>
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
                  Aucun article actif.
                </TableCell>
              </TableRow>
            )}
            {data?.lignes.map((l) => (
              <TableRow key={l.articleId}>
                <TableCell className="font-medium">{l.nom}</TableCell>
                <TableCell>{l.categorie || '—'}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {l.sousLeSeuil && <AlertTriangle className="h-3.5 w-3.5 text-destructive" />}
                    <span className={l.sousLeSeuil ? 'font-medium text-destructive' : ''}>
                      {l.quantiteEnStock} {l.unite}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right">{formatMAD(l.coutMoyenPondere)}</TableCell>
                <TableCell className="text-right">{formatMAD(l.valorisation)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
