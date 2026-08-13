import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, Plus, Printer, Trash2 } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SelectNative } from '@/components/ui/select-native';
import { Textarea } from '@/components/ui/textarea';
import { DocumentsPanel } from '@/features/documents/DocumentsPanel';
import { ApiError, apiFetch } from '@/lib/api';
import * as api from './api';
import type { BonLivraisonContent, LigneContent } from './api';

interface Option {
  id: string;
  nom: string;
}
interface CommandeOption {
  id: string;
  numero: string;
  lignes: { designation: string; unite: string; quantite: string }[];
}

const EMPTY_LIGNE: LigneContent = { designation: '', unite: '', quantiteCommandee: '', quantiteLivree: '1', observations: '' };
const EMPTY_CONTENT: BonLivraisonContent = { clientId: '', chantierId: '', commandeId: '', lieuLivraison: '', notes: '', lignes: [] };

export default function BonLivraisonDetailPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = id === 'nouveau';
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [content, setContent] = useState<BonLivraisonContent>(EMPTY_CONTENT);
  const [error, setError] = useState<string | null>(null);

  const { data: bl, isLoading } = useQuery({
    queryKey: ['bon-livraison', id],
    queryFn: () => api.fetchOne(id as string),
    enabled: !isNew && Boolean(id),
  });

  useEffect(() => {
    if (bl) {
      setContent({
        clientId: bl.client.id,
        chantierId: bl.chantier?.id ?? '',
        commandeId: bl.commande?.id ?? '',
        lieuLivraison: bl.lieuLivraison ?? '',
        notes: bl.notes ?? '',
        lignes: bl.lignes.map((l) => ({
          designation: l.designation,
          unite: l.unite,
          quantiteCommandee: l.quantiteCommandee ?? '',
          quantiteLivree: l.quantiteLivree,
          observations: l.observations ?? '',
        })),
      });
    }
  }, [bl]);

  const { data: clients } = useQuery({ queryKey: ['clients-options'], queryFn: () => apiFetch<{ items: Option[] }>('/api/clients?pageSize=100') });
  const { data: chantiers } = useQuery({ queryKey: ['chantiers-options'], queryFn: () => apiFetch<{ items: Option[] }>('/api/chantiers?pageSize=100') });
  const { data: commandes } = useQuery({
    queryKey: ['commandes-options', content.clientId],
    queryFn: () => apiFetch<{ items: CommandeOption[] }>(`/api/commandes?pageSize=50&clientId=${content.clientId}`),
    enabled: Boolean(content.clientId),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['bons-livraison-list'] });
    queryClient.invalidateQueries({ queryKey: ['bons-livraison-resume'] });
  };

  const saveMutation = useMutation({
    mutationFn: () => (isNew ? api.create(content) : api.update(id as string, content)),
    onSuccess: (saved) => {
      invalidate();
      if (isNew) navigate(`/bons-livraison/${saved.id}`, { replace: true });
      else queryClient.invalidateQueries({ queryKey: ['bon-livraison', id] });
      setError(null);
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Erreur inattendue.'),
  });
  const deleteMutation = useMutation({
    mutationFn: () => api.remove(id as string),
    onSuccess: () => {
      invalidate();
      navigate('/bons-livraison');
    },
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

  function chargerDepuisCommande() {
    const commande = commandes?.items.find((c) => c.id === content.commandeId);
    if (!commande) return;
    setContent((c) => ({
      ...c,
      lignes: commande.lignes.map((l) => ({
        designation: l.designation,
        unite: l.unite,
        quantiteCommandee: l.quantite,
        quantiteLivree: l.quantite,
        observations: '',
      })),
    }));
  }

  if (!isNew && isLoading) return <p className="text-muted-foreground">Chargement…</p>;

  return (
    <div className="space-y-6">
      <Link to="/bons-livraison" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
        ← Retour aux bons de livraison
      </Link>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{isNew ? 'Nouveau bon de livraison' : bl?.numero}</h1>
        {bl && (
          <div className="flex flex-wrap gap-2">
            <Link to={`/bons-livraison/${bl.id}/imprimer`} className={buttonVariants({ variant: 'outline', className: 'gap-2' })}>
              <Printer className="h-4 w-4" />
              Imprimer
            </Link>
            <Button
              variant="ghost"
              className="gap-2 text-destructive hover:text-destructive"
              onClick={() => {
                if (confirm('Supprimer ce bon de livraison ?')) deleteMutation.mutate();
              }}
            >
              <Trash2 className="h-4 w-4" />
              Supprimer
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardContent className="grid grid-cols-2 gap-4 pt-6">
          <div className="space-y-1.5">
            <Label>Client *</Label>
            <SelectNative
              value={content.clientId}
              onChange={(e) => setContent((c) => ({ ...c, clientId: e.target.value, commandeId: '' }))}
            >
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
            <SelectNative value={content.chantierId} onChange={(e) => setContent((c) => ({ ...c, chantierId: e.target.value }))}>
              <option value="">— Aucun —</option>
              {chantiers?.items.map((ch) => (
                <option key={ch.id} value={ch.id}>
                  {ch.nom}
                </option>
              ))}
            </SelectNative>
          </div>
          <div className="space-y-1.5">
            <Label>Commande d'origine</Label>
            <div className="flex gap-2">
              <SelectNative
                value={content.commandeId}
                onChange={(e) => setContent((c) => ({ ...c, commandeId: e.target.value }))}
                disabled={!content.clientId}
              >
                <option value="">— Aucune —</option>
                {commandes?.items.map((cmd) => (
                  <option key={cmd.id} value={cmd.id}>
                    {cmd.numero}
                  </option>
                ))}
              </SelectNative>
              {content.commandeId && (
                <Button type="button" variant="outline" size="sm" className="shrink-0 gap-1.5" onClick={chargerDepuisCommande}>
                  <Download className="h-3.5 w-3.5" />
                  Charger les lignes
                </Button>
              )}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Lieu de livraison</Label>
            <Input value={content.lieuLivraison} onChange={(e) => setContent((c) => ({ ...c, lieuLivraison: e.target.value }))} />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label>Notes</Label>
            <Textarea rows={2} value={content.notes} onChange={(e) => setContent((c) => ({ ...c, notes: e.target.value }))} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 pt-6">
          <h3 className="font-medium">Lignes livrées</h3>
          {content.lignes.length > 0 && (
            <div className="grid grid-cols-[1fr_70px_90px_90px_1fr_28px] gap-2 text-xs font-medium text-muted-foreground">
              <span>Désignation</span>
              <span>Unité</span>
              <span>Qté commandée</span>
              <span>Qté livrée</span>
              <span>Observations</span>
              <span />
            </div>
          )}
          {content.lignes.map((l, i) => (
            <div key={i} className="grid grid-cols-[1fr_70px_90px_90px_1fr_28px] items-center gap-2">
              <Input value={l.designation} onChange={(e) => updateLigne(i, 'designation', e.target.value)} />
              <Input value={l.unite} onChange={(e) => updateLigne(i, 'unite', e.target.value)} />
              <Input type="number" min="0" step="0.01" value={l.quantiteCommandee} onChange={(e) => updateLigne(i, 'quantiteCommandee', e.target.value)} />
              <Input type="number" min="0" step="0.01" value={l.quantiteLivree} onChange={(e) => updateLigne(i, 'quantiteLivree', e.target.value)} />
              <Input value={l.observations} onChange={(e) => updateLigne(i, 'observations', e.target.value)} placeholder="ex. Reliquat à livrer" />
              <button className="text-muted-foreground hover:text-destructive" onClick={() => removeLigne(i)}>
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground" onClick={addLigne}>
            <Plus className="h-3.5 w-3.5" />
            Ajouter une ligne
          </Button>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !content.clientId}>
        {saveMutation.isPending ? 'Enregistrement…' : 'Enregistrer le bon de livraison'}
      </Button>

      {!isNew && bl && <DocumentsPanel entiteType="BON_LIVRAISON" entiteId={bl.id} />}
    </div>
  );
}
