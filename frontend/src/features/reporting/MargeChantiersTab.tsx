import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

export function MargeChantiersTab() {
  const [debut, setDebut] = useState(firstOfYear());
  const [fin, setFin] = useState(today());
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['reporting-marge-chantiers', debut, fin],
    queryFn: () => api.fetchMargeChantiers({ debut, fin }),
  });

  async function handleExport() {
    setExportError(null);
    setExporting(true);
    try {
      await api.exportMargeChantiers({ debut, fin });
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

      <p className="text-sm text-muted-foreground">
        Marge = recettes facturées − dépenses réelles. Le coût de main-d'œuvre (pointages) est indicatif : il n'est
        soustrait que si vous ne l'avez pas déjà saisi comme dépense chantier.
      </p>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Chantier</TableHead>
              <TableHead className="text-right">Recettes facturées</TableHead>
              <TableHead className="text-right">Dépenses réelles</TableHead>
              <TableHead className="text-right">Marge</TableHead>
              <TableHead className="text-right">Coût main-d'œuvre (indicatif)</TableHead>
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
            {!isLoading && data?.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Aucune activité sur cette période.
                </TableCell>
              </TableRow>
            )}
            {data?.map((l) => (
              <TableRow key={l.chantierId}>
                <TableCell className="font-medium">{l.chantierNom}</TableCell>
                <TableCell className="text-right">{formatMAD(l.recettesFacturees)}</TableCell>
                <TableCell className="text-right">{formatMAD(l.depensesReelles)}</TableCell>
                <TableCell className={`text-right font-medium ${l.marge < 0 ? 'text-destructive' : ''}`}>{formatMAD(l.marge)}</TableCell>
                <TableCell className="text-right text-muted-foreground">{formatMAD(l.coutMainDoeuvrePointages)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
