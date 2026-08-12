import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FileText, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ApiError } from '@/lib/api';
import { formatDate } from '@/lib/date';
import * as api from './api';
import type { TypeEntiteDocument } from './types';

function formatTaille(octets: number): string {
  if (octets < 1024) return `${octets} o`;
  if (octets < 1024 * 1024) return `${(octets / 1024).toFixed(1)} Ko`;
  return `${(octets / (1024 * 1024)).toFixed(1)} Mo`;
}

interface DocumentsPanelProps {
  entiteType: TypeEntiteDocument;
  entiteId: string;
}

export function DocumentsPanel({ entiteType, entiteId }: DocumentsPanelProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: documents, isLoading } = useQuery({
    queryKey: ['documents', entiteType, entiteId],
    queryFn: () => api.fetchDocuments(entiteType, entiteId),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['documents', entiteType, entiteId] });

  const uploadMutation = useMutation({
    mutationFn: (fichier: File) => api.uploadDocument(entiteType, entiteId, fichier),
    onSuccess: () => {
      invalidate();
      setError(null);
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Erreur inattendue.'),
  });
  const deleteMutation = useMutation({
    mutationFn: api.deleteDocument,
    onSuccess: () => {
      invalidate();
      setError(null);
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Erreur inattendue.'),
  });

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const fichier = e.target.files?.[0];
    if (fichier) uploadMutation.mutate(fichier);
    e.target.value = '';
  }

  async function handleOpen(id: string) {
    setError(null);
    try {
      await api.ouvrirDocument(id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur inattendue.');
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Documents</h3>
        <Button size="sm" className="gap-2" onClick={() => fileInputRef.current?.click()} disabled={uploadMutation.isPending}>
          <Upload className="h-3.5 w-3.5" />
          {uploadMutation.isPending ? 'Envoi…' : 'Ajouter un fichier'}
        </Button>
        <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fichier</TableHead>
              <TableHead>Ajouté par</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Taille</TableHead>
              <TableHead />
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
            {!isLoading && documents?.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Aucun document.
                </TableCell>
              </TableRow>
            )}
            {documents?.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="font-medium">
                  <button className="flex items-center gap-2 hover:underline" onClick={() => handleOpen(d.id)}>
                    <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                    {d.nom}
                  </button>
                </TableCell>
                <TableCell className="text-muted-foreground">{d.uploadedPar ? `${d.uploadedPar.prenom} ${d.uploadedPar.nom}` : '—'}</TableCell>
                <TableCell className="text-muted-foreground">{formatDate(d.createdAt)}</TableCell>
                <TableCell className="text-right text-muted-foreground">{formatTaille(d.tailleOctets)}</TableCell>
                <TableCell>
                  <button className="text-muted-foreground hover:text-destructive" onClick={() => deleteMutation.mutate(d.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
