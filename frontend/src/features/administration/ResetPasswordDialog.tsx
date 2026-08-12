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
import type { Utilisateur } from './types';

interface ResetPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  utilisateur: Utilisateur | null;
  onSubmit: (nouveauMotDePasse: string) => Promise<unknown>;
  submitting: boolean;
  error: string | null;
}

export function ResetPasswordDialog({ open, onOpenChange, utilisateur, onSubmit, submitting, error }: ResetPasswordDialogProps) {
  const [motDePasse, setMotDePasse] = useState('');

  useEffect(() => {
    if (open) setMotDePasse('');
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Réinitialiser le mot de passe</DialogTitle>
          <DialogDescription>
            {utilisateur ? `${utilisateur.prenom} ${utilisateur.nom} sera déconnecté(e) de toutes ses sessions actives.` : ''}
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(motDePasse);
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="nouveauMotDePasse">Nouveau mot de passe *</Label>
            <Input
              id="nouveauMotDePasse"
              type="password"
              required
              minLength={8}
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Enregistrement…' : 'Réinitialiser'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
