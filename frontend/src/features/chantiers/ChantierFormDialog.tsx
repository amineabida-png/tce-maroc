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
import { Textarea } from '@/components/ui/textarea';
import { apiFetch } from '@/lib/api';
import type { ChantierFormValues } from './api';
import { STATUT_CHANTIER_LABELS, type Chantier } from './types';

interface ClientOption {
  id: string;
  nom: string;
}
interface UtilisateurOption {
  id: string;
  nom: string;
  prenom: string;
  role: string;
}

const EMPTY: ChantierFormValues = {
  nom: '',
  clientId: '',
  adresse: '',
  ville: '',
  budgetPrevisionnel: '',
  dateDebut: '',
  dateFinPrevue: '',
  dateFinReelle: '',
  avancement: 0,
  statut: 'EN_PREPARATION',
  conducteurId: '',
  description: '',
};

function toFormValues(c: Chantier | null): ChantierFormValues {
  if (!c) return EMPTY;
  return {
    nom: c.nom,
    clientId: c.clientId ?? '',
    adresse: c.adresse ?? '',
    ville: c.ville ?? '',
    budgetPrevisionnel: c.budgetPrevisionnel ?? '',
    dateDebut: c.dateDebut ? c.dateDebut.slice(0, 10) : '',
    dateFinPrevue: c.dateFinPrevue ? c.dateFinPrevue.slice(0, 10) : '',
    dateFinReelle: c.dateFinReelle ? c.dateFinReelle.slice(0, 10) : '',
    avancement: c.avancement,
    statut: c.statut,
    conducteurId: c.conducteurId ?? '',
    description: c.description ?? '',
  };
}

interface ChantierFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chantier: Chantier | null;
  onSubmit: (values: ChantierFormValues) => Promise<unknown>;
  submitting: boolean;
  error: string | null;
}

export function ChantierFormDialog({ open, onOpenChange, chantier, onSubmit, submitting, error }: ChantierFormDialogProps) {
  const [values, setValues] = useState<ChantierFormValues>(EMPTY);

  useEffect(() => {
    if (open) setValues(toFormValues(chantier));
  }, [open, chantier]);

  const { data: clients } = useQuery({
    queryKey: ['clients-options'],
    queryFn: () => apiFetch<{ items: ClientOption[] }>('/api/clients?pageSize=100'),
    enabled: open,
  });
  const { data: conducteurs } = useQuery({
    queryKey: ['utilisateurs-conducteurs'],
    queryFn: () => apiFetch<UtilisateurOption[]>('/api/utilisateurs?role=CONDUCTEUR_TRAVAUX'),
    enabled: open,
  });

  function set<K extends keyof ChantierFormValues>(key: K, value: ChantierFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{chantier ? 'Modifier le chantier' : 'Nouveau chantier'}</DialogTitle>
          <DialogDescription>Fiche chantier : client, budget, planning, avancement.</DialogDescription>
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
              <Label htmlFor="nom">Nom du chantier *</Label>
              <Input id="nom" required value={values.nom} onChange={(e) => set('nom', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="clientId">Client</Label>
              <SelectNative id="clientId" value={values.clientId} onChange={(e) => set('clientId', e.target.value)}>
                <option value="">— Aucun —</option>
                {clients?.items.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nom}
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
              <Label htmlFor="budget">Budget prévisionnel (DH)</Label>
              <Input
                id="budget"
                type="number"
                min="0"
                step="0.01"
                value={values.budgetPrevisionnel}
                onChange={(e) => set('budgetPrevisionnel', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="statut">Statut</Label>
              <SelectNative id="statut" value={values.statut} onChange={(e) => set('statut', e.target.value)}>
                {Object.entries(STATUT_CHANTIER_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </SelectNative>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="avancement">Avancement (%)</Label>
              <Input
                id="avancement"
                type="number"
                min="0"
                max="100"
                value={values.avancement}
                onChange={(e) => set('avancement', Number(e.target.value))}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="dateDebut">Début</Label>
              <Input id="dateDebut" type="date" value={values.dateDebut} onChange={(e) => set('dateDebut', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dateFinPrevue">Fin prévue</Label>
              <Input
                id="dateFinPrevue"
                type="date"
                value={values.dateFinPrevue}
                onChange={(e) => set('dateFinPrevue', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dateFinReelle">Fin réelle</Label>
              <Input
                id="dateFinReelle"
                type="date"
                value={values.dateFinReelle}
                onChange={(e) => set('dateFinReelle', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="conducteurId">Conducteur de travaux</Label>
            <SelectNative id="conducteurId" value={values.conducteurId} onChange={(e) => set('conducteurId', e.target.value)}>
              <option value="">— Non assigné —</option>
              {conducteurs?.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.prenom} {u.nom}
                </option>
              ))}
            </SelectNative>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" rows={3} value={values.description} onChange={(e) => set('description', e.target.value)} />
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
