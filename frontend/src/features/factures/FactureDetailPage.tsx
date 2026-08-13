import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Printer, Trash2 } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SelectNative } from '@/components/ui/select-native';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ApiError, apiFetch } from '@/lib/api';
import { DocumentsPanel } from '@/features/documents/DocumentsPanel';
import { formatMAD } from '@/lib/currency';
import { formatDate } from '@/lib/date';
import { computeTotaux } from '@/lib/money';
import * as api from './api';
import type { FactureContent, LigneContent } from './api';
import { PaiementFormDialog } from './PaiementFormDialog';
import { STATUT_FACTURE_LABELS, STATUT_FACTURE_VARIANT, STATUTS_MODIFIABLES } from './types';

interface Option {
  id: string;
  nom: string;
}

const EMPTY_LIGNE: LigneContent = { designation: '', unite: '', quantite: '1', prixUnitaire: '0' };
const EMPTY_CONTENT: FactureContent = {
  type: 'FACTURE',
  clientId: '',
  chantierId: '',
  dateEcheance: '',
  tauxTva: '20',
  tauxRetenueGarantie: '0',
  lignes: [],
};

export default function FactureDetailPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = id === 'nouveau';
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [content, setContent] = useState<FactureContent>(EMPTY_CONTENT);
  const [error, setError] = useState<string | null>(null);
  const [paiementDialogOpen, setPaiementDialogOpen] = useState(false);
  const [paiementError, setPaiementError] = useState<string | null>(null);

  const { data: facture, isLoading } = useQuery({
    queryKey: ['facture', id],
    queryFn: () => api.fetchFacture(id as string),
    enabled: !isNew && Boolean(id),
  });

  useEffect(() => {
    if (facture) {
      setContent({
        type: facture.type,
        clientId: facture.client.id,
        chantierId: facture.chantier?.id ?? '',
        dateEcheance: facture.dateEcheance ? facture.dateEcheance.slice(0, 10) : '',
        tauxTva: facture.tauxTva,
        tauxRetenueGarantie: facture.tauxRetenueGarantie,
        lignes: facture.lignes.map((l) => ({ designation: l.designation, unite: l.unite, quantite: l.quantite, prixUnitaire: l.prixUnitaire })),
      });
    }
  }, [facture]);

  const { data: clients } = useQuery({ queryKey: ['clients-options'], queryFn: () => apiFetch<{ items: Option[] }>('/api/clients?pageSize=100') });
  const { data: chantiers } = useQuery({
    queryKey: ['chantiers-options'],
    queryFn: () => apiFetch<{ items: Option[] }>('/api/chantiers?pageSize=100'),
  });

  const modifiable = isNew || (facture ? STATUTS_MODIFIABLES.includes(facture.statut) : false);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['facture', id] });
    queryClient.invalidateQueries({ queryKey: ['factures-list'] });
  };

  const saveMutation = useMutation({
    mutationFn: () => (isNew ? api.createFacture(content) : api.updateFacture(id as string, content)),
    onSuccess: (saved) => {
      invalidate();
      if (isNew) navigate(`/factures/${saved.id}`, { replace: true });
      setError(null);
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Erreur inattendue.'),
  });
  const envoyerMutation = useMutation({ mutationFn: () => api.envoyerFacture(id as string), onSuccess: invalidate });
  const annulerMutation = useMutation({
    mutationFn: () => api.annulerFacture(id as string),
    onSuccess: invalidate,
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Erreur inattendue.'),
  });
  const deleteMutation = useMutation({ mutationFn: () => api.deleteFacture(id as string), onSuccess: () => navigate('/factures') });
  const paiementMutation = useMutation({
    mutationFn: (values: api.PaiementFormValues) => api.addPaiement(id as string, values),
    onSuccess: () => {
      invalidate();
      setPaiementDialogOpen(false);
    },
    onError: (err) => setPaiementError(err instanceof ApiError ? err.message : 'Erreur inattendue.'),
  });
  const deletePaiementMutation = useMutation({
    mutationFn: (paiementId: string) => api.deletePaiement(id as string, paiementId),
    onSuccess: invalidate,
  });

  function addLigne() {
    setContent((c) => ({ ...c, lignes: [...c.lignes, { ...EMPTY_LIGNE }] }));
  }
  function removeLigne(i: number) {
    setContent((c) => ({ ...c, lignes: c.lignes.filter((_, idx) => idx !== i) }));
  }
  function updateLigne(i: number, field: keyof LigneContent, value: string) {
    setContent((c) => ({ ...c, lignes: c.lignes.map((l, idx) => (idx === i ? { ...l, [field]: value } : l)) }));
  }

  const totauxApercu = computeTotaux(content.lignes, content.tauxTva || '0', content.tauxRetenueGarantie || '0');

  if (!isNew && isLoading) return <p className="text-muted-foreground">Chargement…</p>;

  return (
    <div className="space-y-6">
      <Link to="/factures" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
        ← Retour aux factures
      </Link>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold">{isNew ? 'Nouvelle facture' : facture?.numero}</h1>
          {facture && (
            <Badge variant={facture.enRetard ? 'destructive' : STATUT_FACTURE_VARIANT[facture.statut]}>
              {facture.enRetard ? 'En retard' : STATUT_FACTURE_LABELS[facture.statut]}
            </Badge>
          )}
          {facture?.commande && <span className="text-sm text-muted-foreground">(depuis commande {facture.commande.numero})</span>}
        </div>
        {facture && (
          <div className="flex flex-wrap gap-2">
            <Link to={`/factures/${facture.id}/imprimer`} className={buttonVariants({ variant: 'outline', className: 'gap-2' })}>
              <Printer className="h-4 w-4" />
              Imprimer
            </Link>
            {facture.statut === 'BROUILLON' && (
              <>
                <Button variant="outline" onClick={() => envoyerMutation.mutate()}>
                  Envoyer
                </Button>
                <Button
                  variant="ghost"
                  className="gap-2 text-destructive hover:text-destructive"
                  onClick={() => {
                    if (confirm('Supprimer cette facture brouillon ?')) deleteMutation.mutate();
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                  Supprimer
                </Button>
              </>
            )}
            {['BROUILLON', 'ENVOYEE'].includes(facture.statut) && (
              <Button variant="ghost" className="text-destructive" onClick={() => annulerMutation.mutate()}>
                Annuler
              </Button>
            )}
          </div>
        )}
      </div>

      <Card>
        <CardContent className="grid grid-cols-2 gap-4 pt-6">
          <div className="space-y-1.5">
            <Label>Type</Label>
            <SelectNative disabled={!modifiable} value={content.type} onChange={(e) => setContent((c) => ({ ...c, type: e.target.value }))}>
              <option value="FACTURE">Facture</option>
              <option value="AVOIR">Avoir</option>
            </SelectNative>
          </div>
          <div className="space-y-1.5">
            <Label>Client *</Label>
            <SelectNative disabled={!modifiable} value={content.clientId} onChange={(e) => setContent((c) => ({ ...c, clientId: e.target.value }))}>
              <option value="">— Choisir —</option>
              {clients?.items.map((cl) => (
                <option key={cl.id} value={cl.id}>
                  {cl.nom}
                </option>
              ))}
            </SelectNative>
          </div>
          <div className="space-y-1.5">
            <Label>Chantier</Label>
            <SelectNative disabled={!modifiable} value={content.chantierId} onChange={(e) => setContent((c) => ({ ...c, chantierId: e.target.value }))}>
              <option value="">— Aucun —</option>
              {chantiers?.items.map((ch) => (
                <option key={ch.id} value={ch.id}>
                  {ch.nom}
                </option>
              ))}
            </SelectNative>
          </div>
          <div className="space-y-1.5">
            <Label>Échéance</Label>
            <Input
              type="date"
              disabled={!modifiable}
              value={content.dateEcheance}
              onChange={(e) => setContent((c) => ({ ...c, dateEcheance: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Taux de TVA (%)</Label>
            <Input
              type="number"
              min="0"
              max="100"
              disabled={!modifiable}
              value={content.tauxTva}
              onChange={(e) => setContent((c) => ({ ...c, tauxTva: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Retenue de garantie (%)</Label>
            <Input
              type="number"
              min="0"
              max="100"
              disabled={!modifiable}
              value={content.tauxRetenueGarantie}
              onChange={(e) => setContent((c) => ({ ...c, tauxRetenueGarantie: e.target.value }))}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 pt-6">
          <h3 className="font-medium">Lignes</h3>
          {content.lignes.length > 0 && (
            <div className="grid grid-cols-[1fr_80px_90px_110px_90px_28px] gap-2 text-xs font-medium text-muted-foreground">
              <span>Désignation</span>
              <span>Unité</span>
              <span>Qté</span>
              <span>P.U. (DH)</span>
              <span className="text-right">Total</span>
              <span />
            </div>
          )}
          {content.lignes.map((l, i) => {
            const total = (Number(l.quantite) || 0) * (Number(l.prixUnitaire) || 0);
            return (
              <div key={i} className="grid grid-cols-[1fr_80px_90px_110px_90px_28px] items-center gap-2">
                <Input disabled={!modifiable} value={l.designation} onChange={(e) => updateLigne(i, 'designation', e.target.value)} />
                <Input disabled={!modifiable} value={l.unite} onChange={(e) => updateLigne(i, 'unite', e.target.value)} />
                <Input type="number" min="0" step="0.01" disabled={!modifiable} value={l.quantite} onChange={(e) => updateLigne(i, 'quantite', e.target.value)} />
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  disabled={!modifiable}
                  value={l.prixUnitaire}
                  onChange={(e) => updateLigne(i, 'prixUnitaire', e.target.value)}
                />
                <span className="text-right text-sm">{formatMAD(total)}</span>
                {modifiable ? (
                  <button className="text-muted-foreground hover:text-destructive" onClick={() => removeLigne(i)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <span />
                )}
              </div>
            );
          })}
          {modifiable && (
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground" onClick={addLigne}>
              <Plus className="h-3.5 w-3.5" />
              Ajouter une ligne
            </Button>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="space-y-1 pt-6 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total HT</span>
              <span>{formatMAD(totauxApercu.montantHT)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">TVA</span>
              <span>{formatMAD(totauxApercu.montantTVA)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total TTC</span>
              <span>{formatMAD(totauxApercu.montantTTC)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Retenue de garantie</span>
              <span>-{formatMAD(totauxApercu.montantRetenueGarantie)}</span>
            </div>
            <div className="flex justify-between border-t pt-1 font-semibold">
              <span>Net à payer</span>
              <span>{formatMAD(totauxApercu.montantNetAPayer)}</span>
            </div>
          </CardContent>
        </Card>
        {facture && !modifiable && (
          <Card>
            <CardContent className="space-y-1 pt-6 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payé</span>
                <span>{formatMAD(facture.montantPaye)}</span>
              </div>
              <div className="flex justify-between border-t pt-1 font-semibold">
                <span>Restant dû</span>
                <span className={facture.montantRestantDu > 0 ? 'text-destructive' : ''}>{formatMAD(facture.montantRestantDu)}</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {modifiable && (
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !content.clientId}>
          {saveMutation.isPending ? 'Enregistrement…' : 'Enregistrer la facture'}
        </Button>
      )}

      {facture && ['ENVOYEE', 'PARTIELLEMENT_PAYEE', 'PAYEE'].includes(facture.statut) && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Paiements</h3>
            {facture.montantRestantDu > 0 && (
              <Button
                size="sm"
                className="gap-2"
                onClick={() => {
                  setPaiementError(null);
                  setPaiementDialogOpen(true);
                }}
              >
                <Plus className="h-4 w-4" />
                Enregistrer un paiement
              </Button>
            )}
          </div>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Référence</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {facture.paiements.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      Aucun paiement enregistré.
                    </TableCell>
                  </TableRow>
                )}
                {facture.paiements.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{formatDate(p.date)}</TableCell>
                    <TableCell>{p.mode || '—'}</TableCell>
                    <TableCell>{p.reference || '—'}</TableCell>
                    <TableCell className="text-right">{formatMAD(p.montant)}</TableCell>
                    <TableCell>
                      <button className="text-muted-foreground hover:text-destructive" onClick={() => deletePaiementMutation.mutate(p.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {!isNew && facture && <DocumentsPanel entiteType="FACTURE" entiteId={facture.id} />}

      <PaiementFormDialog
        open={paiementDialogOpen}
        onOpenChange={setPaiementDialogOpen}
        montantSuggere={facture?.montantRestantDu ?? 0}
        onSubmit={(values) => paiementMutation.mutateAsync(values)}
        submitting={paiementMutation.isPending}
        error={paiementError}
      />
    </div>
  );
}
