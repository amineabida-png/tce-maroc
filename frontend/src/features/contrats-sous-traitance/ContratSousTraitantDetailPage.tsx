import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FileBarChart, Plus, Printer, Trash2 } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SelectNative } from '@/components/ui/select-native';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ApiError, apiFetch } from '@/lib/api';
import { formatMAD } from '@/lib/currency';
import { formatDate } from '@/lib/date';
import { computeTotaux } from '@/lib/money';
import { isRoleManager } from '@/lib/roles';
import { useAuthStore } from '@/store/auth';
import * as situationsApi from '@/features/situations/api';
import { STATUT_SITUATION_LABELS, STATUT_SITUATION_VARIANT } from '@/features/situations/types';
import * as api from './api';
import type { ContratSousTraitantContent, LigneContent } from './api';
import { STATUT_CST_LABELS, STATUT_CST_VARIANT, STATUTS_MODIFIABLES, type StatutContratSousTraitant } from './types';

interface Option {
  id: string;
  nom: string;
}

const EMPTY_LIGNE: LigneContent = { designation: '', unite: '', quantite: '1', prixUnitaire: '0' };
const EMPTY_CONTENT: ContratSousTraitantContent = { sousTraitantId: '', chantierId: '', tauxTva: '20', lignes: [] };

export default function ContratSousTraitantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = id === 'nouveau';
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const role = useAuthStore((s) => s.user?.role);
  const manager = isRoleManager(role);

  const [content, setContent] = useState<ContratSousTraitantContent>(EMPTY_CONTENT);
  const [error, setError] = useState<string | null>(null);

  const { data: contrat, isLoading } = useQuery({
    queryKey: ['contrat-sous-traitance', id],
    queryFn: () => api.fetchOne(id as string),
    enabled: !isNew && Boolean(id),
  });

  useEffect(() => {
    if (contrat) {
      setContent({
        sousTraitantId: contrat.sousTraitant.id,
        chantierId: contrat.chantier?.id ?? '',
        tauxTva: contrat.tauxTva,
        lignes: contrat.lignes.map((l) => ({ designation: l.designation, unite: l.unite, quantite: l.quantite, prixUnitaire: l.prixUnitaire })),
      });
    }
  }, [contrat]);

  const { data: sousTraitants } = useQuery({
    queryKey: ['sous-traitants-options'],
    queryFn: () => apiFetch<{ items: Option[] }>('/api/sous-traitants?pageSize=100'),
  });
  const { data: chantiers } = useQuery({
    queryKey: ['chantiers-options'],
    queryFn: () => apiFetch<{ items: Option[] }>('/api/chantiers?pageSize=100'),
  });
  const { data: situations } = useQuery({
    queryKey: ['situations-list', 'contrat', id],
    queryFn: () => situationsApi.fetchList({ contratSousTraitantId: id as string, page: 1 }),
    enabled: !isNew && Boolean(id),
  });

  const manageable = isNew || (contrat ? STATUTS_MODIFIABLES.includes(contrat.statut) || manager : false);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['contrats-sous-traitance-list'] });
    queryClient.invalidateQueries({ queryKey: ['contrats-sous-traitance-resume'] });
  };

  const saveMutation = useMutation({
    mutationFn: () => (isNew ? api.create(content) : api.update(id as string, content)),
    onSuccess: (saved) => {
      invalidate();
      if (isNew) navigate(`/contrats-sous-traitance/${saved.id}`, { replace: true });
      else queryClient.invalidateQueries({ queryKey: ['contrat-sous-traitance', id] });
      setError(null);
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Erreur inattendue.'),
  });
  const statutMutation = useMutation({
    mutationFn: (statut: StatutContratSousTraitant) => api.changeStatut(id as string, statut),
    onSuccess: () => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: ['contrat-sous-traitance', id] });
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Erreur inattendue.'),
  });
  const deleteMutation = useMutation({
    mutationFn: () => api.remove(id as string),
    onSuccess: () => {
      invalidate();
      navigate('/contrats-sous-traitance');
    },
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
      <Link to="/contrats-sous-traitance" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
        ← Retour aux contrats de sous-traitance
      </Link>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold">{isNew ? 'Nouveau contrat de sous-traitance' : contrat?.numero}</h1>
          {contrat && <Badge variant={STATUT_CST_VARIANT[contrat.statut]}>{STATUT_CST_LABELS[contrat.statut]}</Badge>}
        </div>
        {contrat && (
          <div className="flex flex-wrap gap-2">
            <Link to={`/contrats-sous-traitance/${contrat.id}/imprimer`} className={buttonVariants({ variant: 'outline', className: 'gap-2' })}>
              <Printer className="h-4 w-4" />
              Imprimer
            </Link>
            {contrat.statut === 'BROUILLON' && (
              <Button variant="outline" onClick={() => statutMutation.mutate('CONFIRME')}>
                Confirmer
              </Button>
            )}
            {contrat.statut === 'CONFIRME' && (
              <>
                <Button variant="outline" onClick={() => statutMutation.mutate('TERMINE')}>
                  Marquer terminé
                </Button>
                <Button variant="ghost" className="text-destructive" onClick={() => statutMutation.mutate('ANNULE')}>
                  Annuler
                </Button>
              </>
            )}
            {(contrat.statut === 'BROUILLON' || manager) && (
              <Button
                variant="ghost"
                className="gap-2 text-destructive hover:text-destructive"
                onClick={() => {
                  if (confirm('Supprimer ce contrat de sous-traitance ?')) deleteMutation.mutate();
                }}
              >
                <Trash2 className="h-4 w-4" />
                Supprimer
              </Button>
            )}
          </div>
        )}
      </div>

      <Card>
        <CardContent className="grid grid-cols-2 gap-4 pt-6">
          <div className="space-y-1.5">
            <Label>Sous-traitant *</Label>
            <SelectNative
              disabled={!manageable}
              value={content.sousTraitantId}
              onChange={(e) => setContent((c) => ({ ...c, sousTraitantId: e.target.value }))}
            >
              <option value="">— Choisir —</option>
              {sousTraitants?.items.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.nom}
                </option>
              ))}
            </SelectNative>
          </div>
          <div className="space-y-1.5">
            <Label>Chantier</Label>
            <SelectNative
              disabled={!manageable}
              value={content.chantierId}
              onChange={(e) => setContent((c) => ({ ...c, chantierId: e.target.value }))}
            >
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
              disabled={!manageable}
              value={content.tauxTva}
              onChange={(e) => setContent((c) => ({ ...c, tauxTva: e.target.value }))}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 pt-6">
          <h3 className="font-medium">Lignes du marché</h3>
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
                <Input disabled={!manageable} value={l.designation} onChange={(e) => updateLigne(i, 'designation', e.target.value)} />
                <Input disabled={!manageable} value={l.unite} onChange={(e) => updateLigne(i, 'unite', e.target.value)} />
                <Input type="number" min="0" step="0.01" disabled={!manageable} value={l.quantite} onChange={(e) => updateLigne(i, 'quantite', e.target.value)} />
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  disabled={!manageable}
                  value={l.prixUnitaire}
                  onChange={(e) => updateLigne(i, 'prixUnitaire', e.target.value)}
                />
                <span className="text-right text-sm">{formatMAD(total)}</span>
                {manageable ? (
                  <button className="text-muted-foreground hover:text-destructive" onClick={() => removeLigne(i)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <span />
                )}
              </div>
            );
          })}
          {manageable && (
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

      {manageable && (
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !content.sousTraitantId}>
          {saveMutation.isPending ? 'Enregistrement…' : 'Enregistrer le contrat'}
        </Button>
      )}

      {contrat && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Situations d'avancement</h3>
            <Link
              to={`/situations/nouveau?contratSousTraitantId=${contrat.id}`}
              className={buttonVariants({ size: 'sm', className: 'gap-2' })}
            >
              <FileBarChart className="h-4 w-4" />
              Nouvelle situation
            </Link>
          </div>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N°</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Montant situation TTC</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {situations?.items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      Aucune situation émise.
                    </TableCell>
                  </TableRow>
                )}
                {situations?.items.map((s) => (
                  <TableRow key={s.id} className="cursor-pointer" onClick={() => navigate(`/situations/${s.id}`)}>
                    <TableCell className="font-medium">
                      {s.numero} <span className="text-muted-foreground">(situation {s.numeroSituation})</span>
                    </TableCell>
                    <TableCell>{formatDate(s.date)}</TableCell>
                    <TableCell className="text-right">{formatMAD(s.totaux.montantTTC)}</TableCell>
                    <TableCell>
                      <Badge variant={STATUT_SITUATION_VARIANT[s.statut]}>{STATUT_SITUATION_LABELS[s.statut]}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
