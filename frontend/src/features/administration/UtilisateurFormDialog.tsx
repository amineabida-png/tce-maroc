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
import type { UtilisateurFormValues } from './api';
import { ROLE_LABELS, type Utilisateur } from './types';

const EMPTY: UtilisateurFormValues = { email: '', motDePasse: '', nom: '', prenom: '', role: 'COMMERCIAL' };

function toFormValues(u: Utilisateur | null): UtilisateurFormValues {
  if (!u) return EMPTY;
  return { email: u.email, motDePasse: '', nom: u.nom, prenom: u.prenom, role: u.role };
}

interface UtilisateurFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  utilisateur: Utilisateur | null;
  onSubmit: (values: UtilisateurFormValues) => Promise<unknown>;
  submitting: boolean;
  error: string | null;
}

export function UtilisateurFormDialog({ open, onOpenChange, utilisateur, onSubmit, submitting, error }: UtilisateurFormDialogProps) {
  const [values, setValues] = useState<UtilisateurFormValues>(EMPTY);

  useEffect(() => {
    if (open) setValues(toFormValues(utilisateur));
  }, [open, utilisateur]);

  function set<K extends keyof UtilisateurFormValues>(key: K, value: UtilisateurFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{utilisateur ? "Modifier l'utilisateur" : 'Nouvel utilisateur'}</DialogTitle>
          <DialogDescription>Compte de connexion à l'application.</DialogDescription>
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
          <div className="space-y-1.5">
            <Label htmlFor="email">Email *</Label>
            <Input id="email" type="email" required value={values.email} onChange={(e) => set('email', e.target.value)} />
          </div>
          {!utilisateur && (
            <div className="space-y-1.5">
              <Label htmlFor="motDePasse">Mot de passe initial *</Label>
              <Input
                id="motDePasse"
                type="password"
                required
                minLength={8}
                value={values.motDePasse}
                onChange={(e) => set('motDePasse', e.target.value)}
              />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="role">Rôle</Label>
            <SelectNative id="role" value={values.role} onChange={(e) => set('role', e.target.value as UtilisateurFormValues['role'])}>
              {Object.entries(ROLE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
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
