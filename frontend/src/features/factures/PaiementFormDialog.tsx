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
import { today } from '@/lib/date';
import type { PaiementFormValues } from './api';

const EMPTY: PaiementFormValues = { montant: '', date: today(), mode: '', reference: '' };

interface PaiementFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  montantSuggere: number;
  onSubmit: (values: PaiementFormValues) => Promise<unknown>;
  submitting: boolean;
  error: string | null;
}

export function PaiementFormDialog({ open, onOpenChange, montantSuggere, onSubmit, submitting, error }: PaiementFormDialogProps) {
  const [values, setValues] = useState<PaiementFormValues>(EMPTY);

  useEffect(() => {
    if (open) setValues({ ...EMPTY, montant: montantSuggere > 0 ? String(montantSuggere) : '' });
  }, [open, montantSuggere]);

  function set<K extends keyof PaiementFormValues>(key: K, value: PaiementFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enregistrer un paiement</DialogTitle>
          <DialogDescription>Encaissement rattaché à cette facture.</DialogDescription>
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
            <div className="space-y-1.5">
              <Label htmlFor="date">Date *</Label>
              <Input id="date" type="date" required value={values.date} onChange={(e) => set('date', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="mode">Mode</Label>
              <Input id="mode" placeholder="Espèces, Chèque, Virement…" value={values.mode} onChange={(e) => set('mode', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reference">Référence</Label>
              <Input id="reference" value={values.reference} onChange={(e) => set('reference', e.target.value)} />
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
