import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, RotateCcw, XCircle } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatMAD } from '@/lib/currency';
import { formatDate } from '@/lib/date';
import { ApiError } from '@/lib/api';
import { DocumentsPanel } from '@/features/documents/DocumentsPanel';
import * as api from './api';
import { ChantierFormDialog } from './ChantierFormDialog';
import { DepensesTab } from './DepensesTab';
import { TachesTab } from './TachesTab';
import { STATUT_CHANTIER_LABELS, STATUT_CHANTIER_VARIANT } from './types';

export default function ChantierDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('infos');
  const [editOpen, setEditOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const { data: chantier, isLoading } = useQuery({
    queryKey: ['chantier', id],
    queryFn: () => api.fetchChantier(id as string),
    enabled: Boolean(id),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['chantier', id] });
    queryClient.invalidateQueries({ queryKey: ['chantiers'] });
  };

  const updateMutation = useMutation({
    mutationFn: (values: api.ChantierFormValues) => api.updateChantier(id as string, values),
    onSuccess: () => {
      invalidate();
      setEditOpen(false);
    },
    onError: (err) => setFormError(err instanceof ApiError ? err.message : 'Erreur inattendue.'),
  });
  const deactivateMutation = useMutation({ mutationFn: () => api.deactivateChantier(id as string), onSuccess: invalidate });
  const reactivateMutation = useMutation({ mutationFn: () => api.reactivateChantier(id as string), onSuccess: invalidate });

  if (isLoading || !chantier) {
    return <p className="text-muted-foreground">Chargement…</p>;
  }

  return (
    <div className="space-y-6">
      <Link to="/chantiers" className={buttonVariants({ variant: 'ghost', size: 'sm' }) + ' inline-flex gap-2'}>
        <ArrowLeft className="h-4 w-4" />
        Retour aux chantiers
      </Link>

      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold">{chantier.nom}</h1>
            <Badge variant={STATUT_CHANTIER_VARIANT[chantier.statut]}>{STATUT_CHANTIER_LABELS[chantier.statut]}</Badge>
            {!chantier.actif && <Badge variant="secondary">Désactivé</Badge>}
          </div>
          <p className="text-muted-foreground">
            {chantier.client?.nom || 'Sans client'} {chantier.ville ? `— ${chantier.ville}` : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setFormError(null);
              setEditOpen(true);
            }}
          >
            Modifier
          </Button>
          {chantier.actif ? (
            <Button variant="ghost" className="gap-2 text-destructive hover:text-destructive" onClick={() => deactivateMutation.mutate()}>
              <XCircle className="h-4 w-4" />
              Désactiver
            </Button>
          ) : (
            <Button variant="ghost" className="gap-2" onClick={() => reactivateMutation.mutate()}>
              <RotateCcw className="h-4 w-4" />
              Réactiver
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Progress value={chantier.avancement} className="w-64" />
        <span className="text-sm text-muted-foreground">{chantier.avancement}% d'avancement</span>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="infos">Infos</TabsTrigger>
          <TabsTrigger value="planning">Planning</TabsTrigger>
          <TabsTrigger value="budget">Dépenses & Budget</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="infos" className="mt-4 grid grid-cols-2 gap-4 rounded-lg border p-6 text-sm">
          <div>
            <div className="text-muted-foreground">Client</div>
            <div>{chantier.client?.nom || '—'}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Conducteur de travaux</div>
            <div>{chantier.conducteur ? `${chantier.conducteur.prenom} ${chantier.conducteur.nom}` : '—'}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Adresse</div>
            <div>{chantier.adresse || '—'}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Budget prévisionnel</div>
            <div>{chantier.budgetPrevisionnel ? formatMAD(chantier.budgetPrevisionnel) : '—'}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Début</div>
            <div>{formatDate(chantier.dateDebut)}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Fin prévue</div>
            <div>{formatDate(chantier.dateFinPrevue)}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Fin réelle</div>
            <div>{formatDate(chantier.dateFinReelle)}</div>
          </div>
          {chantier.description && (
            <div className="col-span-2">
              <div className="text-muted-foreground">Description</div>
              <div className="whitespace-pre-wrap">{chantier.description}</div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="planning" className="mt-4">
          <TachesTab chantierId={chantier.id} />
        </TabsContent>

        <TabsContent value="budget" className="mt-4">
          <DepensesTab chantierId={chantier.id} />
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          <DocumentsPanel entiteType="CHANTIER" entiteId={chantier.id} />
        </TabsContent>
      </Tabs>

      <ChantierFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        chantier={chantier}
        onSubmit={(values) => updateMutation.mutateAsync(values)}
        submitting={updateMutation.isPending}
        error={formError}
      />
    </div>
  );
}
