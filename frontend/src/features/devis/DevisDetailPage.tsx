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
import { Textarea } from '@/components/ui/textarea';
import { ApiError, apiFetch } from '@/lib/api';
import { formatMAD } from '@/lib/currency';
import { computeTotaux } from '@/lib/money';
import { isRoleManager } from '@/lib/roles';
import { useAuthStore } from '@/store/auth';
import * as api from './api';
import type { DevisContent, LigneContent, LotContent } from './api';
import { STATUT_DEVIS_LABELS, STATUT_DEVIS_VARIANT, STATUTS_MODIFIABLES, type StatutDevis } from './types';

interface Option {
  id: string;
  nom: string;
}

const EMPTY_LIGNE: LigneContent = { designation: '', unite: '', quantite: '1', prixUnitaire: '0' };
const EMPTY_CONTENT: DevisContent = {
  clientId: '',
  chantierId: '',
  dateValidite: '',
  tauxTva: '20',
  conditions: '',
  lots: [],
  lignesSansLot: [],
};

export default function DevisDetailPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = id === 'nouveau';
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [content, setContent] = useState<DevisContent>(EMPTY_CONTENT);
  const [error, setError] = useState<string | null>(null);

  const { data: devis, isLoading } = useQuery({
    queryKey: ['devis', id],
    queryFn: () => api.fetchDevis(id as string),
    enabled: !isNew && Boolean(id),
  });

  useEffect(() => {
    if (devis) {
      setContent({
        clientId: devis.client.id,
        chantierId: devis.chantier?.id ?? '',
        dateValidite: devis.dateValidite ? devis.dateValidite.slice(0, 10) : '',
        tauxTva: devis.tauxTva,
        conditions: devis.conditions ?? '',
        lots: devis.lots.map((l) => ({
          nom: l.nom,
          lignes: l.lignes.map((li) => ({ designation: li.designation, unite: li.unite, quantite: li.quantite, prixUnitaire: li.prixUnitaire })),
        })),
        lignesSansLot: devis.lignesSansLot.map((li) => ({
          designation: li.designation,
          unite: li.unite,
          quantite: li.quantite,
          prixUnitaire: li.prixUnitaire,
        })),
      });
    }
  }, [devis]);

  const { data: clients } = useQuery({
    queryKey: ['clients-options'],
    queryFn: () => apiFetch<{ items: Option[] }>('/api/clients?pageSize=100'),
  });
  const { data: chantiers } = useQuery({
    queryKey: ['chantiers-options'],
    queryFn: () => apiFetch<{ items: Option[] }>('/api/chantiers?pageSize=100'),
  });

  const role = useAuthStore((s) => s.user?.role);
  const manager = isRoleManager(role);
  const modifiable = isNew || (devis ? STATUTS_MODIFIABLES.includes(devis.statut) || manager : false);

  const saveMutation = useMutation({
    mutationFn: () => (isNew ? api.createDevis(content) : api.updateDevis(id as string, content)),
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ['devis'] });
      if (isNew) navigate(`/devis/${saved.id}`, { replace: true });
      else queryClient.invalidateQueries({ queryKey: ['devis', id] });
      setError(null);
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Erreur inattendue.'),
  });

  const statutMutation = useMutation({
    mutationFn: (statut: StatutDevis) => api.changeStatutDevis(id as string, statut),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devis', id] });
      queryClient.invalidateQueries({ queryKey: ['devis'] });
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Erreur inattendue.'),
  });

  const convertMutation = useMutation({
    mutationFn: () => api.convertirEnCommande(id as string),
    onSuccess: (commande) => navigate(`/commandes/${commande.id}`),
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Erreur inattendue.'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.deleteDevis(id as string),
    onSuccess: () => navigate('/devis'),
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Erreur inattendue.'),
  });

  // --- Édition des lots / lignes ---
  function addLot() {
    setContent((c) => ({ ...c, lots: [...c.lots, { nom: '', lignes: [] }] }));
  }
  function removeLot(lotIdx: number) {
    setContent((c) => ({ ...c, lots: c.lots.filter((_, i) => i !== lotIdx) }));
  }
  function updateLotNom(lotIdx: number, nom: string) {
    setContent((c) => ({ ...c, lots: c.lots.map((l, i) => (i === lotIdx ? { ...l, nom } : l)) }));
  }
  function addLigne(lotIdx: number | null) {
    setContent((c) => {
      if (lotIdx === null) return { ...c, lignesSansLot: [...c.lignesSansLot, { ...EMPTY_LIGNE }] };
      const lots = c.lots.map((l, i) => (i === lotIdx ? { ...l, lignes: [...l.lignes, { ...EMPTY_LIGNE }] } : l));
      return { ...c, lots };
    });
  }
  function removeLigne(lotIdx: number | null, ligneIdx: number) {
    setContent((c) => {
      if (lotIdx === null) return { ...c, lignesSansLot: c.lignesSansLot.filter((_, i) => i !== ligneIdx) };
      const lots = c.lots.map((l, i) => (i === lotIdx ? { ...l, lignes: l.lignes.filter((_, j) => j !== ligneIdx) } : l));
      return { ...c, lots };
    });
  }
  function updateLigne(lotIdx: number | null, ligneIdx: number, field: keyof LigneContent, value: string) {
    setContent((c) => {
      if (lotIdx === null) {
        const lignesSansLot = c.lignesSansLot.map((l, i) => (i === ligneIdx ? { ...l, [field]: value } : l));
        return { ...c, lignesSansLot };
      }
      const lots = c.lots.map((lot, i) =>
        i === lotIdx ? { ...lot, lignes: lot.lignes.map((l, j) => (j === ligneIdx ? { ...l, [field]: value } : l)) } : lot
      );
      return { ...c, lots };
    });
  }

  const toutesLesLignes = [...content.lots.flatMap((l) => l.lignes), ...content.lignesSansLot];
  const totauxApercu = computeTotaux(toutesLesLignes, content.tauxTva || '0');

  if (!isNew && isLoading) return <p className="text-muted-foreground">Chargement…</p>;

  return (
    <div className="space-y-6">
      <Link to="/devis" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
        ← Retour aux devis
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold">{isNew ? 'Nouveau devis' : devis?.numero}</h1>
            {devis && <Badge variant={STATUT_DEVIS_VARIANT[devis.statut]}>{STATUT_DEVIS_LABELS[devis.statut]}</Badge>}
          </div>
        </div>
        {devis && (
          <div className="flex flex-wrap gap-2">
            <Link to={`/devis/${devis.id}/imprimer`} className={buttonVariants({ variant: 'outline', className: 'gap-2' })}>
              <Printer className="h-4 w-4" />
              Imprimer
            </Link>
            {devis.statut === 'BROUILLON' && (
              <Button variant="outline" onClick={() => statutMutation.mutate('ENVOYE')}>
                Marquer envoyé
              </Button>
            )}
            {devis.statut === 'ENVOYE' && (
              <>
                <Button variant="outline" onClick={() => statutMutation.mutate('ACCEPTE')}>
                  Marquer accepté
                </Button>
                <Button variant="ghost" className="text-destructive" onClick={() => statutMutation.mutate('REFUSE')}>
                  Marquer refusé
                </Button>
              </>
            )}
            {devis.statut === 'ACCEPTE' && (
              <Button onClick={() => convertMutation.mutate()} disabled={convertMutation.isPending}>
                Convertir en bon de commande
              </Button>
            )}
            {(devis.statut === 'BROUILLON' || manager) && (
              <Button
                variant="ghost"
                className="gap-2 text-destructive hover:text-destructive"
                onClick={() => {
                  if (confirm('Supprimer ce devis ?')) deleteMutation.mutate();
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
            <Label>Client *</Label>
            <SelectNative
              disabled={!modifiable}
              value={content.clientId}
              onChange={(e) => setContent((c) => ({ ...c, clientId: e.target.value }))}
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
            <SelectNative
              disabled={!modifiable}
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
            <Label>Validité jusqu'au</Label>
            <Input
              type="date"
              disabled={!modifiable}
              value={content.dateValidite}
              onChange={(e) => setContent((c) => ({ ...c, dateValidite: e.target.value }))}
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
          <div className="col-span-2 space-y-1.5">
            <Label>Conditions</Label>
            <Textarea
              rows={2}
              disabled={!modifiable}
              value={content.conditions}
              onChange={(e) => setContent((c) => ({ ...c, conditions: e.target.value }))}
            />
          </div>
        </CardContent>
      </Card>

      {content.lots.map((lot, lotIdx) => (
        <LotEditor
          key={lotIdx}
          lot={lot}
          modifiable={modifiable}
          onNomChange={(nom) => updateLotNom(lotIdx, nom)}
          onAddLigne={() => addLigne(lotIdx)}
          onRemoveLigne={(ligneIdx) => removeLigne(lotIdx, ligneIdx)}
          onUpdateLigne={(ligneIdx, field, value) => updateLigne(lotIdx, ligneIdx, field, value)}
          onRemoveLot={() => removeLot(lotIdx)}
        />
      ))}

      <Card>
        <CardContent className="space-y-3 pt-6">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Lignes sans lot</h3>
          </div>
          <LignesTable
            lignes={content.lignesSansLot}
            modifiable={modifiable}
            onAdd={() => addLigne(null)}
            onRemove={(i) => removeLigne(null, i)}
            onUpdate={(i, field, value) => updateLigne(null, i, field, value)}
          />
        </CardContent>
      </Card>

      {modifiable && (
        <Button variant="outline" className="gap-2" onClick={addLot}>
          <Plus className="h-4 w-4" />
          Nouveau lot
        </Button>
      )}

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
          {saveMutation.isPending ? 'Enregistrement…' : 'Enregistrer le devis'}
        </Button>
      )}
    </div>
  );
}

function LotEditor({
  lot,
  modifiable,
  onNomChange,
  onAddLigne,
  onRemoveLigne,
  onUpdateLigne,
  onRemoveLot,
}: {
  lot: LotContent;
  modifiable: boolean;
  onNomChange: (nom: string) => void;
  onAddLigne: () => void;
  onRemoveLigne: (ligneIdx: number) => void;
  onUpdateLigne: (ligneIdx: number, field: keyof LigneContent, value: string) => void;
  onRemoveLot: () => void;
}) {
  return (
    <Card>
      <CardContent className="space-y-3 pt-6">
        <div className="flex items-center gap-2">
          <Input
            className="max-w-sm font-medium"
            placeholder="Nom du lot (ex. Gros œuvre)"
            disabled={!modifiable}
            value={lot.nom}
            onChange={(e) => onNomChange(e.target.value)}
          />
          {modifiable && (
            <button className="text-muted-foreground hover:text-destructive" onClick={onRemoveLot} title="Supprimer le lot">
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
        <LignesTable lignes={lot.lignes} modifiable={modifiable} onAdd={onAddLigne} onRemove={onRemoveLigne} onUpdate={onUpdateLigne} />
      </CardContent>
    </Card>
  );
}

function LignesTable({
  lignes,
  modifiable,
  onAdd,
  onRemove,
  onUpdate,
}: {
  lignes: LigneContent[];
  modifiable: boolean;
  onAdd: () => void;
  onRemove: (i: number) => void;
  onUpdate: (i: number, field: keyof LigneContent, value: string) => void;
}) {
  return (
    <div className="space-y-2">
      {lignes.length > 0 && (
        <div className="grid grid-cols-[1fr_80px_90px_110px_90px_28px] gap-2 text-xs font-medium text-muted-foreground">
          <span>Désignation</span>
          <span>Unité</span>
          <span>Qté</span>
          <span>P.U. (DH)</span>
          <span className="text-right">Total</span>
          <span />
        </div>
      )}
      {lignes.map((l, i) => {
        const total = (Number(l.quantite) || 0) * (Number(l.prixUnitaire) || 0);
        return (
          <div key={i} className="grid grid-cols-[1fr_80px_90px_110px_90px_28px] items-center gap-2">
            <Input disabled={!modifiable} value={l.designation} onChange={(e) => onUpdate(i, 'designation', e.target.value)} />
            <Input disabled={!modifiable} value={l.unite} onChange={(e) => onUpdate(i, 'unite', e.target.value)} />
            <Input
              type="number"
              min="0"
              step="0.01"
              disabled={!modifiable}
              value={l.quantite}
              onChange={(e) => onUpdate(i, 'quantite', e.target.value)}
            />
            <Input
              type="number"
              min="0"
              step="0.01"
              disabled={!modifiable}
              value={l.prixUnitaire}
              onChange={(e) => onUpdate(i, 'prixUnitaire', e.target.value)}
            />
            <span className="text-right text-sm">{formatMAD(total)}</span>
            {modifiable ? (
              <button className="text-muted-foreground hover:text-destructive" onClick={() => onRemove(i)}>
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            ) : (
              <span />
            )}
          </div>
        );
      })}
      {modifiable && (
        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground" onClick={onAdd}>
          <Plus className="h-3.5 w-3.5" />
          Ajouter une ligne
        </Button>
      )}
      {lignes.length === 0 && !modifiable && <p className="text-sm text-muted-foreground">Aucune ligne.</p>}
    </div>
  );
}
