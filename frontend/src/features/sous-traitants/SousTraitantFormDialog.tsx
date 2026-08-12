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
import { Textarea } from '@/components/ui/textarea';
import type { SousTraitantFormValues } from './api';
import { CORPS_DETAT_SUGGESTIONS, type SousTraitant } from './types';

const EMPTY: SousTraitantFormValues = {
  nom: '',
  corpsDetat: '',
  contactNom: '',
  ice: '',
  rc: '',
  identifiantFiscal: '',
  adresse: '',
  ville: '',
  telephone: '',
  email: '',
  evaluation: '',
  notes: '',
};

function toFormValues(s: SousTraitant | null): SousTraitantFormValues {
  if (!s) return EMPTY;
  return {
    nom: s.nom,
    corpsDetat: s.corpsDetat ?? '',
    contactNom: s.contactNom ?? '',
    ice: s.ice ?? '',
    rc: s.rc ?? '',
    identifiantFiscal: s.identifiantFiscal ?? '',
    adresse: s.adresse ?? '',
    ville: s.ville ?? '',
    telephone: s.telephone ?? '',
    email: s.email ?? '',
    evaluation: s.evaluation ? String(s.evaluation) : '',
    notes: s.notes ?? '',
  };
}

interface SousTraitantFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sousTraitant: SousTraitant | null;
  onSubmit: (values: SousTraitantFormValues) => Promise<void>;
  submitting: boolean;
  error: string | null;
}

export function SousTraitantFormDialog({
  open,
  onOpenChange,
  sousTraitant,
  onSubmit,
  submitting,
  error,
}: SousTraitantFormDialogProps) {
  const [values, setValues] = useState<SousTraitantFormValues>(EMPTY);

  useEffect(() => {
    if (open) setValues(toFormValues(sousTraitant));
  }, [open, sousTraitant]);

  function set<K extends keyof SousTraitantFormValues>(key: K, value: SousTraitantFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{sousTraitant ? 'Modifier le sous-traitant' : 'Nouveau sous-traitant'}</DialogTitle>
          <DialogDescription>Main-d'œuvre spécialisée par corps d'état.</DialogDescription>
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
              <Label htmlFor="corpsDetat">Corps d'état</Label>
              <Input
                id="corpsDetat"
                list="corps-detat-suggestions"
                value={values.corpsDetat}
                onChange={(e) => set('corpsDetat', e.target.value)}
              />
              <datalist id="corps-detat-suggestions">
                {CORPS_DETAT_SUGGESTIONS.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="contactNom">Contact</Label>
              <Input id="contactNom" value={values.contactNom} onChange={(e) => set('contactNom', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="telephone">Téléphone</Label>
              <Input id="telephone" value={values.telephone} onChange={(e) => set('telephone', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={values.email} onChange={(e) => set('email', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="evaluation">Évaluation</Label>
              <SelectNative id="evaluation" value={values.evaluation} onChange={(e) => set('evaluation', e.target.value)}>
                <option value="">—</option>
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {'★'.repeat(n)}
                  </option>
                ))}
              </SelectNative>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="adresse">Adresse</Label>
              <Input id="adresse" value={values.adresse} onChange={(e) => set('adresse', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ville">Ville</Label>
              <Input id="ville" value={values.ville} onChange={(e) => set('ville', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ice">ICE</Label>
              <Input id="ice" value={values.ice} onChange={(e) => set('ice', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rc">RC</Label>
              <Input id="rc" value={values.rc} onChange={(e) => set('rc', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="if">IF</Label>
              <Input id="if" value={values.identifiantFiscal} onChange={(e) => set('identifiantFiscal', e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" rows={3} value={values.notes} onChange={(e) => set('notes', e.target.value)} />
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
