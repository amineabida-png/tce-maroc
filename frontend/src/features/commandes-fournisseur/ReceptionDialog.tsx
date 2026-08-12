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
import type { LigneCommandeFournisseur } from './types';

interface ReceptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lignes: LigneCommandeFournisseur[];
  onSubmit: (lignes: { ligneId: string; quantiteRecue: number }[]) => Promise<unknown>;
  submitting: boolean;
  error: string | null;
}

export function ReceptionDialog({ open, onOpenChange, lignes, onSubmit, submitting, error }: ReceptionDialogProps) {
  const [quantites, setQuantites] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      const initial: Record<string, string> = {};
      for (const l of lignes) {
        const restant = Number(l.quantiteCommandee) - Number(l.quantiteRecue);
        initial[l.id] = restant > 0 ? String(restant) : '0';
      }
      setQuantites(initial);
    }
  }, [open, lignes]);

  function handleSubmit() {
    const payload = Object.entries(quantites)
      .map(([ligneId, v]) => ({ ligneId, quantiteRecue: Number(v) || 0 }))
      .filter((l) => l.quantiteRecue > 0);
    onSubmit(payload);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Réceptionner la commande</DialogTitle>
          <DialogDescription>Indiquez les quantités reçues — la réception peut être partielle.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {lignes.map((l) => {
            const restant = Number(l.quantiteCommandee) - Number(l.quantiteRecue);
            return (
              <div key={l.id} className="flex items-center justify-between gap-3">
                <div className="text-sm">
                  <div className="font-medium">{l.designation}</div>
                  <div className="text-muted-foreground">
                    Commandé : {l.quantiteCommandee} {l.unite} · Déjà reçu : {l.quantiteRecue} {l.unite} · Restant : {restant} {l.unite}
                  </div>
                </div>
                <div className="w-28 space-y-1">
                  <Label className="sr-only">Quantité reçue</Label>
                  <Input
                    type="number"
                    min="0"
                    max={restant}
                    step="0.001"
                    disabled={restant <= 0}
                    value={quantites[l.id] ?? ''}
                    onChange={(e) => setQuantites((q) => ({ ...q, [l.id]: e.target.value }))}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Enregistrement…' : 'Confirmer la réception'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
