import { useEffect, useState } from 'react';
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
import type { OuvrageFormValues } from './api';
import { UNITES_SUGGESTIONS, type Ouvrage } from './types';

const EMPTY: OuvrageFormValues = { corpsDetat: '', designation: '', unite: '', prixUnitaireDefaut: '' };

function toFormValues(o: Ouvrage | null): OuvrageFormValues {
  if (!o) return EMPTY;
  return { corpsDetat: o.corpsDetat, designation: o.designation, unite: o.unite, prixUnitaireDefaut: o.prixUnitaireDefaut };
}

interface OuvrageFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ouvrage: Ouvrage | null;
  onSubmit: (values: OuvrageFormValues) => Promise<unknown>;
  submitting: boolean;
  error: string | null;
}

export function OuvrageFormDialog({ open, onOpenChange, ouvrage, onSubmit, submitting, error }: OuvrageFormDialogProps) {
  const [values, setValues] = useState<OuvrageFormValues>(EMPTY);

  useEffect(() => {
    if (open) setValues(toFormValues(ouvrage));
  }, [open, ouvrage]);

  function set<K extends keyof OuvrageFormValues>(key: K, value: OuvrageFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{ouvrage ? "Modifier l'ouvrage" : 'Nouvel ouvrage'}</DialogTitle>
          <DialogDescription>Prix unitaire réutilisable dans les devis.</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(values);
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="corpsDetat">Corps d'état *</Label>
            <Input
              id="corpsDetat"
              required
              list="corps-detat-suggestions-ouvrage"
              value={values.corpsDetat}
              onChange={(e) => set('corpsDetat', e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="designation">Désignation *</Label>
            <Input id="designation" required value={values.designation} onChange={(e) => set('designation', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="unite">Unité *</Label>
              <Input id="unite" required list="unites-suggestions" value={values.unite} onChange={(e) => set('unite', e.target.value)} />
              <datalist id="unites-suggestions">
                {UNITES_SUGGESTIONS.map((u) => (
                  <option key={u} value={u} />
                ))}
              </datalist>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prix">Prix unitaire par défaut (DH) *</Label>
              <Input
                id="prix"
                type="number"
                min="0"
                step="0.01"
                required
                value={values.prixUnitaireDefaut}
                onChange={(e) => set('prixUnitaireDefaut', e.target.value)}
              />
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
