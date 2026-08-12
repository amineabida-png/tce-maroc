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
import type { MouvementFormValues } from './api';
import { MODE_PAIEMENT_LABELS, SENS_LABELS, STATUT_MOUVEMENT_LABELS, type CompteTresorerie } from './types';

interface NamedOption {
  id: string;
  nom: string;
}

const EMPTY: MouvementFormValues = {
  compteId: '',
  sens: 'DECAISSEMENT',
  statut: 'REALISE',
  montant: '',
  date: today(),
  modePaiement: 'VIREMENT',
  reference: '',
  description: '',
  chantierId: '',
  fournisseurId: '',
  sousTraitantId: '',
};

interface MouvementFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: MouvementFormValues) => Promise<unknown>;
  submitting: boolean;
  error: string | null;
  defaultCompteId?: string;
}

export function MouvementFormDialog({ open, onOpenChange, onSubmit, submitting, error, defaultCompteId }: MouvementFormDialogProps) {
  const [values, setValues] = useState<MouvementFormValues>(EMPTY);

  useEffect(() => {
    if (open) setValues({ ...EMPTY, compteId: defaultCompteId || '' });
  }, [open, defaultCompteId]);

  const { data: comptes } = useQuery({
    queryKey: ['comptes-options'],
    queryFn: () => apiFetch<{ items: CompteTresorerie[] }>('/api/comptes-tresorerie?pageSize=100'),
    enabled: open,
  });
  const { data: chantiers } = useQuery({
    queryKey: ['chantiers-options'],
    queryFn: () => apiFetch<{ items: NamedOption[] }>('/api/chantiers?pageSize=100'),
    enabled: open,
  });
  const { data: fournisseurs } = useQuery({
    queryKey: ['fournisseurs-options'],
    queryFn: () => apiFetch<{ items: NamedOption[] }>('/api/fournisseurs?pageSize=100'),
    enabled: open,
  });
  const { data: sousTraitants } = useQuery({
    queryKey: ['sous-traitants-options'],
    queryFn: () => apiFetch<{ items: NamedOption[] }>('/api/sous-traitants?pageSize=100'),
    enabled: open,
  });

  function set<K extends keyof MouvementFormValues>(key: K, value: MouvementFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nouveau mouvement</DialogTitle>
          <DialogDescription>Encaissement ou décaissement hors facturation client.</DialogDescription>
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
              <Label htmlFor="compteId">Compte *</Label>
              <SelectNative id="compteId" required value={values.compteId} onChange={(e) => set('compteId', e.target.value)}>
                <option value="">— Choisir —</option>
                {comptes?.items.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nom}
                  </option>
                ))}
              </SelectNative>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sens">Sens</Label>
              <SelectNative id="sens" value={values.sens} onChange={(e) => set('sens', e.target.value as MouvementFormValues['sens'])}>
                {Object.entries(SENS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </SelectNative>
            </div>
          </div>
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
              <Label htmlFor="statut">Statut</Label>
              <SelectNative id="statut" value={values.statut} onChange={(e) => set('statut', e.target.value as MouvementFormValues['statut'])}>
                {Object.entries(STATUT_MOUVEMENT_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </SelectNative>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="modePaiement">Mode de paiement</Label>
              <SelectNative
                id="modePaiement"
                value={values.modePaiement}
                onChange={(e) => set('modePaiement', e.target.value as MouvementFormValues['modePaiement'])}
              >
                {Object.entries(MODE_PAIEMENT_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </SelectNative>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="fournisseurId">Fournisseur</Label>
              <SelectNative id="fournisseurId" value={values.fournisseurId} onChange={(e) => set('fournisseurId', e.target.value)}>
                <option value="">— Aucun —</option>
                {fournisseurs?.items.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.nom}
                  </option>
                ))}
              </SelectNative>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sousTraitantId">Sous-traitant</Label>
              <SelectNative id="sousTraitantId" value={values.sousTraitantId} onChange={(e) => set('sousTraitantId', e.target.value)}>
                <option value="">— Aucun —</option>
                {sousTraitants?.items.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nom}
                  </option>
                ))}
              </SelectNative>
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
            <Label htmlFor="description">Description</Label>
            <Input id="description" value={values.description} onChange={(e) => set('description', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reference">Référence</Label>
            <Input id="reference" value={values.reference} onChange={(e) => set('reference', e.target.value)} />
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
