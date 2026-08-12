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
import { SelectNative } from '@/components/ui/select-native';
import type { CompteFormValues } from './api';
import { TYPE_COMPTE_LABELS, type CompteTresorerie } from './types';

const EMPTY: CompteFormValues = { nom: '', type: 'BANQUE', banque: '', rib: '', soldeInitial: '0' };

function toFormValues(c: CompteTresorerie | null): CompteFormValues {
  if (!c) return EMPTY;
  return { nom: c.nom, type: c.type, banque: c.banque ?? '', rib: c.rib ?? '', soldeInitial: c.soldeInitial };
}

interface CompteFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  compte: CompteTresorerie | null;
  onSubmit: (values: CompteFormValues) => Promise<unknown>;
  submitting: boolean;
  error: string | null;
}

export function CompteFormDialog({ open, onOpenChange, compte, onSubmit, submitting, error }: CompteFormDialogProps) {
  const [values, setValues] = useState<CompteFormValues>(EMPTY);

  useEffect(() => {
    if (open) setValues(toFormValues(compte));
  }, [open, compte]);

  function set<K extends keyof CompteFormValues>(key: K, value: CompteFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{compte ? 'Modifier le compte' : 'Nouveau compte'}</DialogTitle>
          <DialogDescription>Compte bancaire ou caisse espèces.</DialogDescription>
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
              <Label htmlFor="nom">Nom *</Label>
              <Input id="nom" required value={values.nom} onChange={(e) => set('nom', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="type">Type</Label>
              <SelectNative id="type" value={values.type} onChange={(e) => set('type', e.target.value as CompteFormValues['type'])}>
                {Object.entries(TYPE_COMPTE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </SelectNative>
            </div>
          </div>
          {values.type === 'BANQUE' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="banque">Banque</Label>
                <Input id="banque" value={values.banque} onChange={(e) => set('banque', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rib">RIB</Label>
                <Input id="rib" value={values.rib} onChange={(e) => set('rib', e.target.value)} />
              </div>
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="soldeInitial">Solde initial (DH)</Label>
            <Input
              id="soldeInitial"
              type="number"
              step="0.01"
              value={values.soldeInitial}
              onChange={(e) => set('soldeInitial', e.target.value)}
            />
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
