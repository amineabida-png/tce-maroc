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
import type { TacheFormValues } from './api';
import { STATUT_TACHE_LABELS, type TacheChantier } from './types';

const EMPTY: TacheFormValues = {
  nom: '',
  dateDebut: '',
  dateFin: '',
  avancement: 0,
  statut: 'A_FAIRE',
  ordre: 0,
  predecesseurId: '',
};

function toFormValues(t: TacheChantier | null, nextOrdre: number): TacheFormValues {
  if (!t) return { ...EMPTY, ordre: nextOrdre };
  return {
    nom: t.nom,
    dateDebut: t.dateDebut ? t.dateDebut.slice(0, 10) : '',
    dateFin: t.dateFin ? t.dateFin.slice(0, 10) : '',
    avancement: t.avancement,
    statut: t.statut,
    ordre: t.ordre,
    predecesseurId: t.predecesseurId ?? '',
  };
}

interface TacheFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tache: TacheChantier | null;
  autresTaches: TacheChantier[]; // pour le sélecteur de prédécesseur
  nextOrdre: number;
  onSubmit: (values: TacheFormValues) => Promise<void>;
  submitting: boolean;
  error: string | null;
}

export function TacheFormDialog({
  open,
  onOpenChange,
  tache,
  autresTaches,
  nextOrdre,
  onSubmit,
  submitting,
  error,
}: TacheFormDialogProps) {
  const [values, setValues] = useState<TacheFormValues>(EMPTY);

  useEffect(() => {
    if (open) setValues(toFormValues(tache, nextOrdre));
  }, [open, tache, nextOrdre]);

  function set<K extends keyof TacheFormValues>(key: K, value: TacheFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  const selectableAsPredecesseur = autresTaches.filter((t) => t.id !== tache?.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{tache ? 'Modifier la tâche' : 'Nouvelle tâche'}</DialogTitle>
          <DialogDescription>Étape du planning de chantier.</DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(values);
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="nom">Nom de la tâche *</Label>
            <Input id="nom" required value={values.nom} onChange={(e) => set('nom', e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="dateDebut">Début</Label>
              <Input id="dateDebut" type="date" value={values.dateDebut} onChange={(e) => set('dateDebut', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dateFin">Fin</Label>
              <Input id="dateFin" type="date" value={values.dateFin} onChange={(e) => set('dateFin', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="statut">Statut</Label>
              <SelectNative id="statut" value={values.statut} onChange={(e) => set('statut', e.target.value)}>
                {Object.entries(STATUT_TACHE_LABELS).map(([value, label]) => (
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

          <div className="space-y-1.5">
            <Label htmlFor="predecesseurId">Tâche précédente (dépendance)</Label>
            <SelectNative
              id="predecesseurId"
              value={values.predecesseurId}
              onChange={(e) => set('predecesseurId', e.target.value)}
            >
              <option value="">— Aucune —</option>
              {selectableAsPredecesseur.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nom}
                </option>
              ))}
            </SelectNative>
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
