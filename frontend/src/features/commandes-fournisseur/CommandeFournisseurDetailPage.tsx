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
import type { CommandeFournisseurContent, LigneContent } from './api';
import { ReceptionDialog } from './ReceptionDialog';
import { STATUT_CF_LABELS, STATUT_CF_VARIANT, STATUTS_MODIFIABLES, STATUTS_RECEPTIONNABLES, type StatutCommandeFournisseur } from './types';

interface Option {
  id: string;
  nom: string;
}
interface ArticleOption extends Option {
  unite: string;
}

const EMPTY_LIGNE: LigneContent = { articleId: '', designation: '', unite: '', quantiteCommandee: '1', prixUnitaire: '0' };
const EMPTY_CONTENT: CommandeFournisseurContent = { fournisseurId: '', chantierId: '', tauxTva: '20', lignes: [] };

export default function CommandeFournisseurDetailPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = id === 'nouveau';
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [content, setContent] = useState<CommandeFournisseurContent>(EMPTY_CONTENT);
  const [error, setError] = useState<string | null>(null);
  const [receptionOpen, setReceptionOpen] = useState(false);
  const [receptionError, setReceptionError] = useState<string | null>(null);

  const { data: cf, isLoading } = useQuery({
    queryKey: ['commande-fournisseur', id],
    queryFn: () => api.fetchOne(id as string),
    enabled: !isNew && Boolean(id),
  });

  useEffect(() => {
    if (cf) {
      setContent({
        fournisseurId: cf.fournisseur.id,
        chantierId: cf.chantier?.id ?? '',
        tauxTva: cf.tauxTva,
        lignes: cf.lignes.map((l) => ({
          articleId: l.article?.id ?? '',
          designation: l.designation,
          unite: l.unite,
          quantiteCommandee: l.quantiteCommandee,
          prixUnitaire: l.prixUnitaire,
        })),
      });
    }
  }, [cf]);

  const { data: fournisseurs } = useQuery({
    queryKey: ['fournisseurs-options'],
    queryFn: () => apiFetch<{ items: Option[] }>('/api/fournisseurs?pageSize=100'),
  });
  const { data: chantiers } = useQuery({
    queryKey: ['chantiers-options'],
    queryFn: () => apiFetch<{ items: Option[] }>('/api/chantiers?pageSize=100'),
  });
  const { data: articles } = useQuery({
    queryKey: ['articles-options'],
    queryFn: () => apiFetch<{ items: ArticleOption[] }>('/api/articles?pageSize=200'),
  });

  const modifiable = isNew || (cf ? STATUTS_MODIFIABLES.includes(cf.statut) : false);
  const receptionnable = cf ? STATUTS_RECEPTIONNABLES.includes(cf.statut) : false;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['commande-fournisseur', id] });
    queryClient.invalidateQueries({ queryKey: ['commandes-fournisseur-list'] });
    queryClient.invalidateQueries({ queryKey: ['articles'] });
  };

  const saveMutation = useMutation({
    mutationFn: () => (isNew ? api.create(content) : api.update(id as string, content)),
    onSuccess: (saved) => {
      invalidate();
      if (isNew) navigate(`/commandes-fournisseur/${saved.id}`, { replace: true });
      setError(null);
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Erreur inattendue.'),
  });
  const statutMutation = useMutation({
    mutationFn: (statut: StatutCommandeFournisseur) => api.changeStatut(id as string, statut),
    onSuccess: invalidate,
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Erreur inattendue.'),
  });
  const deleteMutation = useMutation({ mutationFn: () => api.remove(id as string), onSuccess: () => navigate('/commandes-fournisseur') });
  const receptionMutation = useMutation({
    mutationFn: (lignes: { ligneId: string; quantiteRecue: number }[]) => api.receptionner(id as string, lignes),
    onSuccess: () => {
      invalidate();
      setReceptionOpen(false);
    },
    onError: (err) => setReceptionError(err instanceof ApiError ? err.message : 'Erreur inattendue.'),
  });

  function addLigne() {
    setContent((c) => ({ ...c, lignes: [...c.lignes, { ...EMPTY_LIGNE }] }));
  }
  function removeLigne(i: number) {
    setContent((c) => ({ ...c, lignes: c.lignes.filter((_, idx) => idx !== i) }));
  }
  function updateLigne(i: number, field: keyof LigneContent, value: string) {
    setContent((c) => ({
      ...c,
      lignes: c.lignes.map((l, idx) => {
        if (idx !== i) return l;
        const updated = { ...l, [field]: value };
        if (field === 'articleId') {
          const art = articles?.items.find((a) => a.id === value);
          if (art) {
            updated.unite = art.unite;
            if (!updated.designation) updated.designation = art.nom;
          }
        }
        return updated;
      }),
    }));
  }

  const totauxApercu = computeTotaux(content.lignes.map((l) => ({ quantite: l.quantiteCommandee, prixUnitaire: l.prixUnitaire })), content.tauxTva || '0');

  if (!isNew && isLoading) return <p className="text-muted-foreground">Chargement…</p>;

  return (
    <div className="space-y-6">
      <Link to="/commandes-fournisseur" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
        ← Retour aux commandes fournisseurs
      </Link>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold">{isNew ? 'Nouvelle commande fournisseur' : cf?.numero}</h1>
          {cf && <Badge variant={STATUT_CF_VARIANT[cf.statut]}>{STATUT_CF_LABELS[cf.statut]}</Badge>}
        </div>
        {cf && (
          <div className="flex flex-wrap gap-2">
            <Link to={`/commandes-fournisseur/${cf.id}/imprimer`} className={buttonVariants({ variant: 'outline', className: 'gap-2' })}>
              <Printer className="h-4 w-4" />
              Imprimer
            </Link>
            {cf.statut === 'BROUILLON' && (
              <>
                <Button variant="outline" onClick={() => statutMutation.mutate('ENVOYEE')}>
                  Marquer envoyée
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
            {receptionnable && (
              <Button
                onClick={() => {
                  setReceptionError(null);
                  setReceptionOpen(true);
                }}
              >
                Réceptionner
              </Button>
            )}
            {['BROUILLON', 'ENVOYEE'].includes(cf.statut) && (
              <Button variant="ghost" className="text-destructive" onClick={() => statutMutation.mutate('ANNULEE')}>
                Annuler
              </Button>
            )}
          </div>
        )}
      </div>

      <Card>
        <CardContent className="grid grid-cols-2 gap-4 pt-6">
          <div className="space-y-1.5">
            <Label>Fournisseur *</Label>
            <SelectNative disabled={!modifiable} value={content.fournisseurId} onChange={(e) => setContent((c) => ({ ...c, fournisseurId: e.target.value }))}>
              <option value="">— Choisir —</option>
              {fournisseurs?.items.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nom}
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
            <div className="grid grid-cols-[160px_1fr_70px_90px_100px_90px_28px] gap-2 text-xs font-medium text-muted-foreground">
              <span>Article (catalogue)</span>
              <span>Désignation</span>
              <span>Unité</span>
              <span>Qté</span>
              <span>P.U. (DH)</span>
              <span className="text-right">Total</span>
              <span />
            </div>
          )}
          {content.lignes.map((l, i) => {
            const total = (Number(l.quantiteCommandee) || 0) * (Number(l.prixUnitaire) || 0);
            return (
              <div key={i} className="grid grid-cols-[160px_1fr_70px_90px_100px_90px_28px] items-center gap-2">
                <SelectNative disabled={!modifiable} value={l.articleId} onChange={(e) => updateLigne(i, 'articleId', e.target.value)}>
                  <option value="">—</option>
                  {articles?.items.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nom}
                    </option>
                  ))}
                </SelectNative>
                <Input disabled={!modifiable} value={l.designation} onChange={(e) => updateLigne(i, 'designation', e.target.value)} />
                <Input disabled={!modifiable} value={l.unite} onChange={(e) => updateLigne(i, 'unite', e.target.value)} />
                <Input
                  type="number"
                  min="0"
                  step="0.001"
                  disabled={!modifiable}
                  value={l.quantiteCommandee}
                  onChange={(e) => updateLigne(i, 'quantiteCommandee', e.target.value)}
                />
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
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !content.fournisseurId}>
          {saveMutation.isPending ? 'Enregistrement…' : 'Enregistrer la commande'}
        </Button>
      )}

      {cf && (
        <ReceptionDialog
          open={receptionOpen}
          onOpenChange={setReceptionOpen}
          lignes={cf.lignes}
          onSubmit={(lignes) => receptionMutation.mutateAsync(lignes)}
          submitting={receptionMutation.isPending}
          error={receptionError}
        />
      )}
    </div>
  );
}
