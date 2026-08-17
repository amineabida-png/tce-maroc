import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ApiError } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import * as api from './api';
import { ApparenceSection } from './ApparenceSection';
import { LogoField } from './LogoField';
import { NumerotationsSection } from './NumerotationsSection';
import type { Societe } from './types';

const EMPTY: api.SocieteFormValues = {
  nom: '',
  formeJuridique: '',
  adresse: '',
  ville: '',
  telephone: '',
  email: '',
  logo: '',
  cachet: '',
  ice: '',
  rc: '',
  identifiantFiscal: '',
  patente: '',
  cnss: '',
  rib: '',
  tauxTvaDefaut: '20',
  tauxRetenueGarantie: '10',
  tauxRetenueSource: '0',
};

function toFormValues(s: Societe): api.SocieteFormValues {
  return {
    nom: s.nom,
    formeJuridique: s.formeJuridique ?? '',
    adresse: s.adresse ?? '',
    ville: s.ville ?? '',
    telephone: s.telephone ?? '',
    email: s.email ?? '',
    logo: s.logo ?? '',
    cachet: s.cachet ?? '',
    ice: s.ice ?? '',
    rc: s.rc ?? '',
    identifiantFiscal: s.identifiantFiscal ?? '',
    patente: s.patente ?? '',
    cnss: s.cnss ?? '',
    rib: s.rib ?? '',
    tauxTvaDefaut: s.tauxTvaDefaut,
    tauxRetenueGarantie: s.tauxRetenueGarantie,
    tauxRetenueSource: s.tauxRetenueSource,
  };
}

export default function SocietePage() {
  const role = useAuthStore((s) => s.user?.role);
  const editable = role === 'ADMIN' || role === 'DIRECTEUR';
  const queryClient = useQueryClient();

  const [values, setValues] = useState<api.SocieteFormValues>(EMPTY);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: societe, isLoading } = useQuery({
    queryKey: ['societe'],
    queryFn: () => api.fetchSociete(),
  });

  useEffect(() => {
    if (societe) setValues(toFormValues(societe));
  }, [societe]);

  const saveMutation = useMutation({
    mutationFn: api.updateSociete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['societe'] });
      setSaved(true);
      setError(null);
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Erreur inattendue.'),
  });

  function set<K extends keyof api.SocieteFormValues>(key: K, value: api.SocieteFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
    setSaved(false);
  }

  if (isLoading || !societe) return <p className="text-muted-foreground">Chargement…</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Paramètres de la société</h1>
        <p className="text-muted-foreground">
          {editable
            ? 'Identité légale, TVA et numérotation — utilisés sur tous les devis, bons de commande et factures.'
            : 'Lecture seule — la modification est réservée à l’encadrement (Admin, Directeur).'}
        </p>
      </div>

      <ApparenceSection />

      <form
        className="space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          if (editable) saveMutation.mutate(values);
        }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Identité</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <LogoField value={values.logo} onChange={(logo) => set('logo', logo)} editable={editable} />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="nom">Raison sociale *</Label>
                <Input id="nom" required disabled={!editable} value={values.nom} onChange={(e) => set('nom', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="formeJuridique">Forme juridique</Label>
                <Input
                  id="formeJuridique"
                  placeholder="SARL, SARL-AU, SA…"
                  disabled={!editable}
                  value={values.formeJuridique}
                  onChange={(e) => set('formeJuridique', e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="adresse">Adresse</Label>
              <Textarea id="adresse" rows={2} disabled={!editable} value={values.adresse} onChange={(e) => set('adresse', e.target.value)} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="ville">Ville</Label>
                <Input id="ville" disabled={!editable} value={values.ville} onChange={(e) => set('ville', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="telephone">Téléphone</Label>
                <Input id="telephone" disabled={!editable} value={values.telephone} onChange={(e) => set('telephone', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  disabled={!editable}
                  value={values.email}
                  onChange={(e) => set('email', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cachet d'entreprise</CardTitle>
            <p className="text-sm text-muted-foreground">
              Affiché uniquement à la demande sur les documents imprimés (devis, factures, bons de commande) — jamais par
              défaut.
            </p>
          </CardHeader>
          <CardContent>
            <LogoField
              label="Cachet / tampon"
              value={values.cachet}
              onChange={(cachet) => set('cachet', cachet)}
              editable={editable}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Identifiants légaux</CardTitle>
            <p className="text-sm text-muted-foreground">Repris automatiquement sur les devis, bons de commande et factures.</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="ice">ICE</Label>
                <Input id="ice" disabled={!editable} value={values.ice} onChange={(e) => set('ice', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rc">RC</Label>
                <Input id="rc" disabled={!editable} value={values.rc} onChange={(e) => set('rc', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="identifiantFiscal">Identifiant fiscal (IF)</Label>
                <Input
                  id="identifiantFiscal"
                  disabled={!editable}
                  value={values.identifiantFiscal}
                  onChange={(e) => set('identifiantFiscal', e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="patente">Patente</Label>
                <Input id="patente" disabled={!editable} value={values.patente} onChange={(e) => set('patente', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cnss">CNSS</Label>
                <Input id="cnss" disabled={!editable} value={values.cnss} onChange={(e) => set('cnss', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rib">RIB</Label>
                <Input id="rib" disabled={!editable} value={values.rib} onChange={(e) => set('rib', e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Paramètres fiscaux par défaut</CardTitle>
            <p className="text-sm text-muted-foreground">Valeurs proposées à la création d'un document — ajustables sur chaque pièce individuellement.</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="tauxTvaDefaut">TVA par défaut (%)</Label>
                <Input
                  id="tauxTvaDefaut"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  disabled={!editable}
                  value={values.tauxTvaDefaut}
                  onChange={(e) => set('tauxTvaDefaut', e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tauxRetenueGarantie">Retenue de garantie (%)</Label>
                <Input
                  id="tauxRetenueGarantie"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  disabled={!editable}
                  value={values.tauxRetenueGarantie}
                  onChange={(e) => set('tauxRetenueGarantie', e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tauxRetenueSource">Retenue à la source (%)</Label>
                <Input
                  id="tauxRetenueSource"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  disabled={!editable}
                  value={values.tauxRetenueSource}
                  onChange={(e) => set('tauxRetenueSource', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {editable && (
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
            {saved && (
              <span className="flex items-center gap-1.5 text-sm text-green-600">
                <Check className="h-4 w-4" />
                Enregistré
              </span>
            )}
            {error && <span className="text-sm text-destructive">{error}</span>}
          </div>
        )}
      </form>

      <NumerotationsSection numerotations={societe.numerotations} editable={editable} />
    </div>
  );
}
