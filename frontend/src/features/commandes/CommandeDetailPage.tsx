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
import { ApiError, apiFetch } from '@/lib/api';
import { formatMAD } from '@/lib/currency';
import { computeTotaux } from '@/lib/money';
import * as api from './api';
import type { CommandeContent, LigneContent } from './api';
import { STATUT_COMMANDE_LABELS, STATUT_COMMANDE_VARIANT, STATUTS_MODIFIABLES, type StatutCommande } from './types';

interface Option {
  id: string;
  nom: string;
}

const EMPTY_LIGNE: LigneContent = { designation: '', unite: '', quantite: '1', prixUnitaire: '0' };
const EMPTY_CONTENT: CommandeContent = { clientId: '', chantierId: '', tauxTva: '20', lignes: [] };

export default function CommandeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = id === 'nouveau';
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [content, setContent] = useState<CommandeContent>(EMPTY_CONTENT);
  const [error, setError] = useState<string | null>(null);

  const { data: commande, isLoading } = useQuery({
    queryKey: ['commande', id],
    queryFn: () => api.fetchCommande(id as string),
    enabled: !isNew && Boolean(id),
  });

  useEffect(() => {
    if (commande) {
      setContent({
        clientId: commande.client.id,
        chantierId: commande.chantier?.id ?? '',
        tauxTva: commande.tauxTva,
        lignes: commande.lignes.map((l) => ({ designation: l.designation, unite: l.unite, quantite: l.quantite, prixUnitaire: l.prixUnitaire })),
      });
    }
  }, [commande]);

  const { data: clients } = useQuery({ queryKey: ['clients-options'], queryFn: () => apiFetch<{ items: Option[] }>('/api/clients?pageSize=100') });
  const { data: chantiers } = useQuery({
    queryKey: ['chantiers-options'],
    queryFn: () => apiFetch<{ items: Option[] }>('/api/chantiers?pageSize=100'),
  });

  const modifiable = isNew || (commande ? STATUTS_MODIFIABLES.includes(commande.statut) : false);

  const saveMutation = useMutation({
    mutationFn: () => (isNew ? api.createCommande(content) : api.updateCommande(id as string, content)),
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ['commandes-list'] });
      if (isNew) navigate(`/commandes/${saved.id}`, { replace: true });
      else queryClient.invalidateQueries({ queryKey: ['commande', id] });
      setError(null);
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Erreur inattendue.'),
  });

  const statutMutation = useMutation({
    mutationFn: (statut: StatutCommande) => api.changeStatutCommande(id as string, statut),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commande', id] });
      queryClient.invalidateQueries({ queryKey: ['commandes-list'] });
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Erreur inattendue.'),
  });

  const convertMutation = useMutation({
    mutationFn: () => api.convertirEnFacture(id as string),
    onSuccess: (facture) => navigate(`/factures/${facture.id}`),
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Erreur inattendue.'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.deleteCommande(id as string),
    onSuccess: () => navigate('/commandes'),
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Erreur inattendue.'),
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

  const totauxApercu = computeTotaux(content.lignes, content.tauxTva || '0');

  if (!isNew && isLoading) return <p className="text-muted-foreground">Chargement…</p>;

  return (
    <div className="space-y-6">
      <Link to="/commandes" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
        ← Retour aux commandes
      </Link>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold">{isNew ? 'Nouveau bon de commande' : commande?.numero}</h1>
          {commande && <Badge variant={STATUT_COMMANDE_VARIANT[commande.statut]}>{STATUT_COMMANDE_LABELS[commande.statut]}</Badge>}
          {commande?.devis && <span className="text-sm text-muted-foreground">(depuis devis {commande.devis.numero})</span>}
        </div>
        {commande && (
          <div className="flex flex-wrap gap-2">
            <Link to={`/commandes/${commande.id}/imprimer`} className={buttonVariants({ variant: 'outline', className: 'gap-2' })}>
              <Printer className="h-4 w-4" />
              Imprimer
            </Link>
            {commande.statut === 'BROUILLON' && (
              <>
                <Button variant="outline" onClick={() => statutMutation.mutate('CONFIRMEE')}>
                  Confirmer
                </Button>
                <Button
                  variant="ghost"
                  className="gap-2 text-destructive hover:text-destructive"
                  onClick={() => {
                    if (confirm('Supprimer cette commande brouillon ?')) deleteMutation.mutate();
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                  Supprimer
                </Button>
              </>
            )}
            {commande.statut === 'CONFIRMEE' && (
              <>
                <Button onClick={() => convertMutation.mutate()} disabled={convertMutation.isPending}>
                  Convertir en facture
                </Button>
                <Button variant="ghost" className="text-destructive" onClick={() => statutMutation.mutate('ANNULEE')}>
                  Annuler
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      <Card>
        <CardContent className="grid grid-cols-2 gap-4 pt-6">
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

      <Card className="max-w-sm">
        <CardContent className="space-y-1 pt-6 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total HT</span>
            <span>{formatMAD(totauxApercu.montantHT)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">TVA</span>
            <span>{formatMAD(totauxApercu.montantTVA)}</span>
          </div>
          <div className="flex justify-between border-t pt-1 font-semibold">
            <span>Total TTC</span>
            <span>{formatMAD(totauxApercu.montantTTC)}</span>
          </div>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {modifiable && (
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !content.clientId}>
          {saveMutation.isPending ? 'Enregistrement…' : 'Enregistrer la commande'}
        </Button>
      )}
    </div>
  );
}
