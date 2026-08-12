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
import type { ClientFormValues } from './api';
import { TYPE_CLIENT_LABELS, type Client } from './types';

const EMPTY: ClientFormValues = {
  type: 'ENTREPRISE',
  nom: '',
  contactNom: '',
  ice: '',
  rc: '',
  identifiantFiscal: '',
  adresse: '',
  ville: '',
  telephone: '',
  email: '',
  notes: '',
};

function toFormValues(client: Client | null): ClientFormValues {
  if (!client) return EMPTY;
  return {
    type: client.type,
    nom: client.nom,
    contactNom: client.contactNom ?? '',
    ice: client.ice ?? '',
    rc: client.rc ?? '',
    identifiantFiscal: client.identifiantFiscal ?? '',
    adresse: client.adresse ?? '',
    ville: client.ville ?? '',
    telephone: client.telephone ?? '',
    email: client.email ?? '',
    notes: client.notes ?? '',
  };
}

interface ClientFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client | null; // null = création
  onSubmit: (values: ClientFormValues) => Promise<void>;
  submitting: boolean;
  error: string | null;
}

export function ClientFormDialog({ open, onOpenChange, client, onSubmit, submitting, error }: ClientFormDialogProps) {
  const [values, setValues] = useState<ClientFormValues>(EMPTY);

  useEffect(() => {
    if (open) setValues(toFormValues(client));
  }, [open, client]);

  function set<K extends keyof ClientFormValues>(key: K, value: ClientFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{client ? 'Modifier le client' : 'Nouveau client'}</DialogTitle>
          <DialogDescription>
            {client ? 'Mettre à jour la fiche de ce client.' : 'Ajouter un client au répertoire.'}
          </DialogDescription>
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
              <Label htmlFor="type">Type</Label>
              <SelectNative id="type" value={values.type} onChange={(e) => set('type', e.target.value)}>
                {Object.entries(TYPE_CLIENT_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </SelectNative>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nom">Nom / raison sociale *</Label>
              <Input id="nom" required value={values.nom} onChange={(e) => set('nom', e.target.value)} />
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

          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={values.email} onChange={(e) => set('email', e.target.value)} />
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
