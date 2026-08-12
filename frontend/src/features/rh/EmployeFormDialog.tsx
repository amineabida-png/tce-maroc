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
import type { EmployeFormValues } from './api';
import { TYPE_CONTRAT_LABELS, type Employe } from './types';

const EMPTY: EmployeFormValues = {
  nom: '',
  prenom: '',
  cin: '',
  cnss: '',
  poste: '',
  typeContrat: 'CDI',
  dateEmbauche: '',
  tauxHoraire: '',
  telephone: '',
  email: '',
  adresse: '',
  notes: '',
};

function toFormValues(e: Employe | null): EmployeFormValues {
  if (!e) return EMPTY;
  return {
    nom: e.nom,
    prenom: e.prenom,
    cin: e.cin ?? '',
    cnss: e.cnss ?? '',
    poste: e.poste ?? '',
    typeContrat: e.typeContrat,
    dateEmbauche: e.dateEmbauche ? e.dateEmbauche.slice(0, 10) : '',
    tauxHoraire: e.tauxHoraire ?? '',
    telephone: e.telephone ?? '',
    email: e.email ?? '',
    adresse: e.adresse ?? '',
    notes: e.notes ?? '',
  };
}

interface EmployeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employe: Employe | null;
  onSubmit: (values: EmployeFormValues) => Promise<unknown>;
  submitting: boolean;
  error: string | null;
}

export function EmployeFormDialog({ open, onOpenChange, employe, onSubmit, submitting, error }: EmployeFormDialogProps) {
  const [values, setValues] = useState<EmployeFormValues>(EMPTY);

  useEffect(() => {
    if (open) setValues(toFormValues(employe));
  }, [open, employe]);

  function set<K extends keyof EmployeFormValues>(key: K, value: EmployeFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{employe ? "Modifier l'employé" : 'Nouvel employé'}</DialogTitle>
          <DialogDescription>Fiche du personnel — main-d'œuvre suivie au pointage.</DialogDescription>
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
              <Label htmlFor="prenom">Prénom *</Label>
              <Input id="prenom" required value={values.prenom} onChange={(e) => set('prenom', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="cin">CIN</Label>
              <Input id="cin" value={values.cin} onChange={(e) => set('cin', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cnss">N° CNSS</Label>
              <Input id="cnss" value={values.cnss} onChange={(e) => set('cnss', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="poste">Poste</Label>
              <Input id="poste" value={values.poste} onChange={(e) => set('poste', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="typeContrat">Type de contrat</Label>
              <SelectNative
                id="typeContrat"
                value={values.typeContrat}
                onChange={(e) => set('typeContrat', e.target.value as EmployeFormValues['typeContrat'])}
              >
                {Object.entries(TYPE_CONTRAT_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </SelectNative>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="dateEmbauche">Date d'embauche</Label>
              <Input id="dateEmbauche" type="date" value={values.dateEmbauche} onChange={(e) => set('dateEmbauche', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tauxHoraire">Taux horaire (DH)</Label>
              <Input
                id="tauxHoraire"
                type="number"
                min="0"
                step="0.01"
                value={values.tauxHoraire}
                onChange={(e) => set('tauxHoraire', e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="telephone">Téléphone</Label>
              <Input id="telephone" value={values.telephone} onChange={(e) => set('telephone', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={values.email} onChange={(e) => set('email', e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="adresse">Adresse</Label>
            <Input id="adresse" value={values.adresse} onChange={(e) => set('adresse', e.target.value)} />
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
