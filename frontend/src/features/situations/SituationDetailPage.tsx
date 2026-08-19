import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Printer, Trash2 } from 'lucide-react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SelectNative } from '@/components/ui/select-native';
import { ApiError, apiFetch } from '@/lib/api';
import { formatMAD } from '@/lib/currency';
import { computeTotaux } from '@/lib/money';
import * as societeApi from '@/features/societe/api';
import * as api from './api';
import { STATUT_SITUATION_LABELS, STATUT_SITUATION_VARIANT, TRANSITIONS_AUTORISEES, type StatutSituation } from './types';

interface Option {
  id: string;
  nom: string;
}
interface CommandeOption {
  id: string;
  numero: string;
  client: { nom: string };
}
interface ContratOption {
  id: string;
  numero: string;
  sousTraitant: { nom: string };
}

type MarcheType = 'commande' | 'contrat';

interface LigneForm {
  designation: string;
  unite: string;
  quantiteMarche: string;
  prixUnitaire: string;
  avancementPrecedent: number;
  avancementCumulePourcent: string;
}

interface FormContent {
  marcheType: MarcheType;
  marcheId: string;
  chantierId: string;
  tauxTva: string;
  tauxRetenueGarantie: string;
  lignes: LigneForm[];
}

const EMPTY_CONTENT: FormContent = { marcheType: 'commande', marcheId: '', chantierId: '', tauxTva: '20', tauxRetenueGarantie: '10', lignes: [] };

export default function SituationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = id === 'nouveau';
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [content, setContent] = useState<FormContent>(EMPTY_CONTENT);
  const [error, setError] = useState<string | null>(null);

  const { data: situation, isLoading } = useQuery({
    queryKey: ['situation', id],
    queryFn: () => api.fetchOne(id as string),
    enabled: !isNew && Boolean(id),
  });
  const { data: societe } = useQuery({ queryKey: ['societe'], queryFn: () => societeApi.fetchSociete() });
  const { data: commandes } = useQuery({
    queryKey: ['commandes-options-situation'],
    queryFn: () => apiFetch<{ items: CommandeOption[] }>('/api/commandes?pageSize=200'),
    enabled: isNew,
  });
  const { data: contrats } = useQuery({
    queryKey: ['contrats-options-situation'],
    queryFn: () => apiFetch<{ items: ContratOption[] }>('/api/contrats-sous-traitance?pageSize=200'),
    enabled: isNew,
  });
  const { data: chantiers } = useQuery({
    queryKey: ['chantiers-options'],
    queryFn: () => apiFetch<{ items: Option[] }>('/api/chantiers?pageSize=100'),
  });

  // Édition d'une situation existante : le marché ne se change plus (le
  // backend ne l'accepte pas non plus), seuls l'avancement, le chantier et
  // les taux restent modifiables.
  useEffect(() => {
    if (situation) {
      setContent({
        marcheType: situation.commande ? 'commande' : 'contrat',
        marcheId: (situation.commande?.id ?? situation.contratSousTraitant?.id ?? '') as string,
        chantierId: situation.chantier?.id ?? '',
        tauxTva: situation.tauxTva,
        tauxRetenueGarantie: situation.tauxRetenueGarantie,
        lignes: situation.lignes.map((l) => ({
          designation: l.designation,
          unite: l.unite,
          quantiteMarche: l.quantiteMarche,
          prixUnitaire: l.prixUnitaire,
          avancementPrecedent: Number(l.avancementPrecedentPourcent),
          avancementCumulePourcent: l.avancementCumulePourcent,
        })),
      });
    }
  }, [situation]);

  // Taux de retenue de garantie par défaut de la société, pour une nouvelle situation.
  useEffect(() => {
    if (isNew && societe) {
      setContent((c) => ({ ...c, tauxRetenueGarantie: societe.tauxRetenueGarantie }));
    }
  }, [isNew, societe]);

  async function chargerMarche(marcheType: MarcheType, marcheId: string) {
    if (!marcheId) {
      setContent((c) => ({ ...c, marcheType, marcheId: '', lignes: [] }));
      return;
    }
    try {
      const field = marcheType === 'commande' ? 'commandeId' : 'contratSousTraitantId';
      const etat = await api.fetchEtatMarche(field, marcheId);
      setContent((c) => ({
        ...c,
        marcheType,
        marcheId,
        chantierId: etat.chantierId || c.chantierId,
        tauxTva: String(etat.tauxTva),
        lignes: etat.lignes.map((l) => ({
          designation: l.designation,
          unite: l.unite,
          quantiteMarche: String(l.quantiteMarche),
          prixUnitaire: String(l.prixUnitaire),
          avancementPrecedent: l.avancementPrecedent,
          avancementCumulePourcent: String(l.avancementPrecedent),
        })),
      }));
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Impossible de charger le marché sélectionné.');
    }
  }

  // Présélection depuis les liens "Nouvelle situation" (fiche commande / contrat).
  useEffect(() => {
    if (!isNew) return;
    const commandeId = searchParams.get('commandeId');
    const contratSousTraitantId = searchParams.get('contratSousTraitantId');
    if (commandeId) chargerMarche('commande', commandeId);
    else if (contratSousTraitantId) chargerMarche('contrat', contratSousTraitantId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['situations-list'] });
    queryClient.invalidateQueries({ queryKey: ['situations-resume'] });
  };

  const saveMutation = useMutation({
    mutationFn: () =>
      isNew
        ? api.create({
            commandeId: content.marcheType === 'commande' ? content.marcheId : '',
            contratSousTraitantId: content.marcheType === 'contrat' ? content.marcheId : '',
            chantierId: content.chantierId,
            tauxTva: content.tauxTva,
            tauxRetenueGarantie: content.tauxRetenueGarantie,
            lignes: content.lignes,
          })
        : api.update(id as string, {
            commandeId: content.marcheType === 'commande' ? content.marcheId : '',
            contratSousTraitantId: content.marcheType === 'contrat' ? content.marcheId : '',
            chantierId: content.chantierId,
            tauxTva: content.tauxTva,
            tauxRetenueGarantie: content.tauxRetenueGarantie,
            lignes: content.lignes,
          }),
    onSuccess: (saved) => {
      invalidate();
      if (isNew) navigate(`/situations/${saved.id}`, { replace: true });
      else queryClient.invalidateQueries({ queryKey: ['situation', id] });
      setError(null);
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Erreur inattendue.'),
  });
  const statutMutation = useMutation({
    mutationFn: (statut: StatutSituation) => api.changeStatut(id as string, statut),
    onSuccess: () => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: ['situation', id] });
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Erreur inattendue.'),
  });
  const deleteMutation = useMutation({
    mutationFn: () => api.remove(id as string),
    onSuccess: () => {
      invalidate();
      navigate('/situations');
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Erreur inattendue.'),
  });

  function updateAvancement(i: number, value: string) {
    setContent((c) => ({ ...c, lignes: c.lignes.map((l, idx) => (idx === i ? { ...l, avancementCumulePourcent: value } : l)) }));
  }

  const manageable = isNew || Boolean(situation);
  const marcheChoisi = Boolean(content.marcheId);

  const lignesApercu = content.lignes.map((l) => {
    const montantMarche = (Number(l.quantiteMarche) || 0) * (Number(l.prixUnitaire) || 0);
    const cumule = Number(l.avancementCumulePourcent) || 0;
    const montantSituation = (montantMarche * (cumule - l.avancementPrecedent)) / 100;
    return { ...l, montantMarche, montantSituation };
  });
  const totauxApercu = computeTotaux(
    lignesApercu.map((l) => ({ quantite: 1, prixUnitaire: l.montantSituation })),
    content.tauxTva || '0',
    content.tauxRetenueGarantie || '0'
  );
  const avancementInvalide = lignesApercu.some((l) => (Number(l.avancementCumulePourcent) || 0) < l.avancementPrecedent);

  if (!isNew && isLoading) return <p className="text-muted-foreground">Chargement…</p>;

  return (
    <div className="space-y-6">
      <Link to="/situations" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
        ← Retour aux situations
      </Link>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold">
            {isNew ? 'Nouvelle situation de travaux' : `${situation?.numero} (situation ${situation?.numeroSituation})`}
          </h1>
          {situation && <Badge variant={STATUT_SITUATION_VARIANT[situation.statut]}>{STATUT_SITUATION_LABELS[situation.statut]}</Badge>}
        </div>
        {situation && (
          <div className="flex flex-wrap gap-2">
            <Link to={`/situations/${situation.id}/imprimer`} className={buttonVariants({ variant: 'outline', className: 'gap-2' })}>
              <Printer className="h-4 w-4" />
              Imprimer
            </Link>
            {TRANSITIONS_AUTORISEES[situation.statut].map((s) => (
              <Button
                key={s}
                variant={s === 'ANNULEE' ? 'ghost' : 'outline'}
                className={s === 'ANNULEE' ? 'text-destructive' : undefined}
                onClick={() => statutMutation.mutate(s)}
              >
                {s === 'ANNULEE' ? 'Annuler' : `Marquer ${STATUT_SITUATION_LABELS[s].toLowerCase()}`}
              </Button>
            ))}
            <Button
              variant="ghost"
              className="gap-2 text-destructive hover:text-destructive"
              onClick={() => {
                if (confirm('Supprimer cette situation ?')) deleteMutation.mutate();
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
            <Label>Marché *</Label>
            {isNew ? (
              <div className="flex gap-2">
                <SelectNative
                  className="w-40 shrink-0"
                  value={content.marcheType}
                  onChange={(e) => chargerMarche(e.target.value as MarcheType, '')}
                >
                  <option value="commande">Bon de commande</option>
                  <option value="contrat">Sous-traitance</option>
                </SelectNative>
                <SelectNative value={content.marcheId} onChange={(e) => chargerMarche(content.marcheType, e.target.value)}>
                  <option value="">— Choisir —</option>
                  {content.marcheType === 'commande'
                    ? commandes?.items.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.numero} ({c.client.nom})
                        </option>
                      ))
                    : contrats?.items.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.numero} ({c.sousTraitant.nom})
                        </option>
                      ))}
                </SelectNative>
              </div>
            ) : (
              <p className="pt-2 text-sm">
                {situation?.commande
                  ? `${situation.commande.numero} (${situation.commande.client?.nom})`
                  : `${situation?.contratSousTraitant?.numero} (${situation?.contratSousTraitant?.sousTraitant?.nom})`}
              </p>
            )}
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
          <div className="space-y-1.5">
            <Label>Retenue de garantie (%)</Label>
            <Input
              type="number"
              min="0"
              max="100"
              disabled={!manageable}
              value={content.tauxRetenueGarantie}
              onChange={(e) => setContent((c) => ({ ...c, tauxRetenueGarantie: e.target.value }))}
            />
          </div>
        </CardContent>
      </Card>

      {marcheChoisi && (
        <Card>
          <CardContent className="space-y-3 pt-6">
            <h3 className="font-medium">Avancement par ligne</h3>
            <div className="grid grid-cols-[1fr_100px_100px_100px_100px_110px] gap-2 text-xs font-medium text-muted-foreground">
              <span>Désignation</span>
              <span className="text-right">Qté marché</span>
              <span className="text-right">P.U. (DH)</span>
              <span className="text-right">Précédent %</span>
              <span className="text-right">Cumulé %</span>
              <span className="text-right">Montant situation</span>
            </div>
            {lignesApercu.map((l, i) => {
              const invalide = (Number(l.avancementCumulePourcent) || 0) < l.avancementPrecedent;
              return (
                <div key={i} className="grid grid-cols-[1fr_100px_100px_100px_100px_110px] items-center gap-2">
                  <span className="truncate text-sm" title={l.designation}>
                    {l.designation} <span className="text-muted-foreground">({l.unite})</span>
                  </span>
                  <span className="text-right text-sm text-muted-foreground">{l.quantiteMarche}</span>
                  <span className="text-right text-sm text-muted-foreground">{formatMAD(Number(l.prixUnitaire))}</span>
                  <span className="text-right text-sm text-muted-foreground">{l.avancementPrecedent}%</span>
                  <Input
                    type="number"
                    min={l.avancementPrecedent}
                    max="100"
                    step="0.01"
                    disabled={!manageable}
                    className={invalide ? 'border-destructive text-right' : 'text-right'}
                    value={l.avancementCumulePourcent}
                    onChange={(e) => updateAvancement(i, e.target.value)}
                  />
                  <span className="text-right text-sm font-medium">{formatMAD(l.montantSituation)}</span>
                </div>
              );
            })}
            {avancementInvalide && (
              <p className="text-sm text-destructive">L'avancement cumulé ne peut pas être inférieur à l'avancement déjà facturé.</p>
            )}
          </CardContent>
        </Card>
      )}

      {marcheChoisi && (
        <Card className="max-w-sm">
          <CardContent className="space-y-1 pt-6 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total HT de la situation</span>
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
              <span className="text-muted-foreground">Retenue de garantie ({content.tauxRetenueGarantie || 0}%)</span>
              <span>−{formatMAD(totauxApercu.montantRetenueGarantie)}</span>
            </div>
            <div className="flex justify-between border-t pt-1 font-semibold">
              <span>Net à payer</span>
              <span>{formatMAD(totauxApercu.montantNetAPayer)}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      {manageable && marcheChoisi && (
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || avancementInvalide}>
          {saveMutation.isPending ? 'Enregistrement…' : 'Enregistrer la situation'}
        </Button>
      )}
    </div>
  );
}
