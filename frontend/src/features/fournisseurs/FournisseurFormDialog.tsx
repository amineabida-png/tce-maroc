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
import type { FournisseurFormValues } from './api';
import type { Fournisseur } from './types';

const EMPTY: FournisseurFormValues = {
  nom: '',
  categorie: '',
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

function toFormValues(f: Fournisseur | null): FournisseurFormValues {
  if (!f) return EMPTY;
  return {
    nom: f.nom,
    categorie: f.categorie ?? '',
    contactNom: f.contactNom ?? '',
    ice: f.ice ?? '',
    rc: f.rc ?? '',
    identifiantFiscal: f.identifiantFiscal ?? '',
    adresse: f.adresse ?? '',
    ville: f.ville ?? '',
    telephone: f.telephone ?? '',
    email: f.email ?? '',
    evaluation: f.evaluation ? String(f.evaluation) : '',
    notes: f.notes ?? '',
  };
}

interface FournisseurFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fournisseur: Fournisseur | null;
  onSubmit: (values: FournisseurFormValues) => Promise<void>;
  submitting: boolean;
  error: string | null;
}

export function FournisseurFormDialog({
  open,
  onOpenChange,
  fournisseur,
  onSubmit,
  submitting,
  error,
}: FournisseurFormDialogProps) {
  const [values, setValues] = useState<FournisseurFormValues>(EMPTY);

  useEffect(() => {
    if (open) setValues(toFormValues(fournisseur));
  }, [open, fournisseur]);

  function set<K extends keyof FournisseurFormValues>(key: K, value: FournisseurFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{fournisseur ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}</DialogTitle>
          <DialogDescription>Matériaux, location de matériel, services.</DialogDescription>
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
              <Label htmlFor="categorie">Catégorie</Label>
              <Input
                id="categorie"
                placeholder="Matériaux, location, services…"
                value={values.categorie}
                onChange={(e) => set('categorie', e.target.value)}
              />
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
