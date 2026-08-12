import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SelectNative } from '@/components/ui/select-native';
import { apiFetch } from '@/lib/api';
import { today } from '@/lib/date';
import type { SortieFormValues } from './api';

interface ArticleOption {
  id: string;
  nom: string;
  unite: string;
}
interface ChantierOption {
  id: string;
  nom: string;
}

const EMPTY: SortieFormValues = { articleId: '', quantite: '', chantierId: '', date: today(), notes: '' };

interface SortieFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: SortieFormValues) => Promise<unknown>;
  submitting: boolean;
  error: string | null;
}

export function SortieFormDialog({ open, onOpenChange, onSubmit, submitting, error }: SortieFormDialogProps) {
  const [values, setValues] = useState<SortieFormValues>(EMPTY);

  useEffect(() => {
    if (open) setValues(EMPTY);
  }, [open]);

  const { data: articles } = useQuery({
    queryKey: ['articles-options'],
    queryFn: () => apiFetch<{ items: ArticleOption[] }>('/api/articles?pageSize=200'),
    enabled: open,
  });
  const { data: chantiers } = useQuery({
    queryKey: ['chantiers-options'],
    queryFn: () => apiFetch<{ items: ChantierOption[] }>('/api/chantiers?pageSize=100'),
    enabled: open,
  });

  function set<K extends keyof SortieFormValues>(key: K, value: SortieFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sortie de stock</DialogTitle>
          <DialogDescription>Consommation de matériaux, généralement vers un chantier.</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(values);
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="articleId">Article *</Label>
            <SelectNative id="articleId" required value={values.articleId} onChange={(e) => set('articleId', e.target.value)}>
              <option value="">— Choisir —</option>
              {articles?.items.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nom} ({a.unite})
                </option>
              ))}
            </SelectNative>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="quantite">Quantité *</Label>
              <Input
                id="quantite"
                type="number"
                min="0.001"
                step="0.001"
                required
                value={values.quantite}
                onChange={(e) => set('quantite', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" value={values.date} onChange={(e) => set('date', e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="chantierId">Chantier</Label>
            <SelectNative id="chantierId" value={values.chantierId} onChange={(e) => set('chantierId', e.target.value)}>
              <option value="">— Aucun —</option>
              {chantiers?.items.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nom}
                </option>
              ))}
            </SelectNative>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Input id="notes" value={values.notes} onChange={(e) => set('notes', e.target.value)} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Enregistrement…' : 'Enregistrer la sortie'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
