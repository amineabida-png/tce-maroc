import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ApiError } from '@/lib/api';
import * as api from './api';
import { TYPE_DOCUMENT_LABELS, TYPE_DOCUMENT_PREFIXE_DEFAUT, TYPES_DOCUMENT_NUMEROTES, type Numerotation } from './types';

interface NumerotationsSectionProps {
  numerotations: Numerotation[];
  editable: boolean;
}

export function NumerotationsSection({ numerotations, editable }: NumerotationsSectionProps) {
  const queryClient = useQueryClient();
  const [prefixes, setPrefixes] = useState<Record<string, string>>({});
  const [savedTypes, setSavedTypes] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const initial: Record<string, string> = {};
    for (const type of TYPES_DOCUMENT_NUMEROTES) {
      const existing = numerotations.find((n) => n.typeDocument === type);
      initial[type] = existing?.prefixe ?? TYPE_DOCUMENT_PREFIXE_DEFAUT[type] ?? '';
    }
    setPrefixes(initial);
  }, [numerotations]);

  const saveMutation = useMutation({
    mutationFn: (typeDocument: string) => api.upsertNumerotation(typeDocument, prefixes[typeDocument] as string, true),
    onSuccess: (_data, typeDocument) => {
      queryClient.invalidateQueries({ queryKey: ['societe'] });
      setSavedTypes((prev) => ({ ...prev, [typeDocument]: true }));
      setErrors((prev) => ({ ...prev, [typeDocument]: '' }));
    },
    onError: (err, typeDocument) => {
      setErrors((prev) => ({ ...prev, [typeDocument]: err instanceof ApiError ? err.message : 'Erreur inattendue.' }));
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Numérotation des documents</CardTitle>
        <p className="text-sm text-muted-foreground">
          Préfixe appliqué à chaque nouveau document, suivi de l'année et d'un numéro continu remis à zéro chaque année (ex.{' '}
          <span className="font-mono">DEV-2026-0001</span>).
        </p>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Document</TableHead>
              <TableHead>Préfixe</TableHead>
              <TableHead>Dernier numéro ({new Date().getFullYear()})</TableHead>
              {editable && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {TYPES_DOCUMENT_NUMEROTES.map((type) => {
              const existing = numerotations.find((n) => n.typeDocument === type);
              return (
                <TableRow key={type}>
                  <TableCell className="font-medium">{TYPE_DOCUMENT_LABELS[type]}</TableCell>
                  <TableCell>
                    <Input
                      className="w-28 font-mono uppercase"
                      maxLength={10}
                      value={prefixes[type] ?? ''}
                      disabled={!editable}
                      onChange={(e) => {
                        setPrefixes((prev) => ({ ...prev, [type]: e.target.value.toUpperCase() }));
                        setSavedTypes((prev) => ({ ...prev, [type]: false }));
                      }}
                    />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {existing && existing.anneeCourante === new Date().getFullYear() ? existing.dernierNumero : 0}
                  </TableCell>
                  {editable && (
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {errors[type] && <span className="text-xs text-destructive">{errors[type]}</span>}
                        {savedTypes[type] && <Check className="h-4 w-4 text-green-600" />}
                        <button
                          type="button"
                          className="rounded-md border px-2.5 py-1 text-xs font-medium hover:bg-accent disabled:opacity-50"
                          disabled={saveMutation.isPending || !prefixes[type]}
                          onClick={() => saveMutation.mutate(type)}
                        >
                          Enregistrer
                        </button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
