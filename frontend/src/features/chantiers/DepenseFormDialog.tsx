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
import type { DepenseFormValues } from './api';
import { CATEGORIE_DEPENSE_LABELS } from './types';

interface Option {
  id: string;
  nom: string;
}

const EMPTY: DepenseFormValues = {
  categorie: 'MATERIAUX',
  montant: '',
  date: today(),
  description: '',
  fournisseurId: '',
  sousTraitantId: '',
};

interface DepenseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: DepenseFormValues) => Promise<unknown>;
  submitting: boolean;
  error: string | null;
}

export function DepenseFormDialog({ open, onOpenChange, onSubmit, submitting, error }: DepenseFormDialogProps) {
  const [values, setValues] = useState<DepenseFormValues>(EMPTY);

  useEffect(() => {
    if (open) setValues(EMPTY);
  }, [open]);

  const { data: fournisseurs } = useQuery({
    queryKey: ['fournisseurs-options'],
    queryFn: () => apiFetch<{ items: Option[] }>('/api/fournisseurs?pageSize=100'),
    enabled: open,
  });
  const { data: sousTraitants } = useQuery({
    queryKey: ['sous-traitants-options'],
    queryFn: () => apiFetch<{ items: Option[] }>('/api/sous-traitants?pageSize=100'),
    enabled: open,
  });

  function set<K extends keyof DepenseFormValues>(key: K, value: DepenseFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouvelle dépense</DialogTitle>
          <DialogDescription>Coût réel rattaché à ce chantier.</DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(values);
          }}
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="categorie">Catégorie</Label>
              <SelectNative id="categorie" value={values.categorie} onChange={(e) => set('categorie', e.target.value)}>
                {Object.entries(CATEGORIE_DEPENSE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </SelectNative>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="montant">Montant (DH) *</Label>
              <Input
                id="montant"
                type="number"
                min="0.01"
                step="0.01"
                required
                value={values.montant}
                onChange={(e) => set('montant', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="date">Date *</Label>
            <Input id="date" type="date" required value={values.date} onChange={(e) => set('date', e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="fournisseurId">Fournisseur</Label>
              <SelectNative id="fournisseurId" value={values.fournisseurId} onChange={(e) => set('fournisseurId', e.target.value)}>
                <option value="">—</option>
                {fournisseurs?.items.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.nom}
                  </option>
                ))}
              </SelectNative>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sousTraitantId">Sous-traitant</Label>
              <SelectNative
                id="sousTraitantId"
                value={values.sousTraitantId}
                onChange={(e) => set('sousTraitantId', e.target.value)}
              >
                <option value="">—</option>
                {sousTraitants?.items.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nom}
                  </option>
                ))}
              </SelectNative>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Input id="description" value={values.description} onChange={(e) => set('description', e.target.value)} />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Enregistrement…' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
