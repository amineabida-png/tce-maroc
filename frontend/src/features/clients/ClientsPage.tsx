import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, Landmark, Plus, RotateCcw, Search, User, Users, XCircle } from 'lucide-react';
import { PaginationBar } from '@/components/PaginationBar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ApiError } from '@/lib/api';
import * as api from './api';
import { ClientFormDialog } from './ClientFormDialog';
import { TYPE_CLIENT_LABELS, type Client, type TypeClient } from './types';

export default function ClientsPage() {
  const queryClient = useQueryClient();
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [showInactifs, setShowInactifs] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['clients', q, page, showInactifs],
    queryFn: () => api.fetchClients({ q, page, includeInactifs: showInactifs }),
  });
  const { data: resume } = useQuery({
    queryKey: ['clients-resume'],
    queryFn: () => api.fetchResumeClients(),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['clients'] });
    queryClient.invalidateQueries({ queryKey: ['clients-resume'] });
  };

  const createMutation = useMutation({
    mutationFn: api.createClient,
    onSuccess: () => {
      invalidate();
      setDialogOpen(false);
    },
    onError: (err) => setFormError(err instanceof ApiError ? err.message : 'Erreur inattendue.'),
  });

  const updateMutation = useMutation({
    mutationFn: (vars: { id: string; values: api.ClientFormValues }) => api.updateClient(vars.id, vars.values),
    onSuccess: () => {
      invalidate();
      setDialogOpen(false);
    },
    onError: (err) => setFormError(err instanceof ApiError ? err.message : 'Erreur inattendue.'),
  });

  const deactivateMutation = useMutation({ mutationFn: api.deactivateClient, onSuccess: invalidate });
  const reactivateMutation = useMutation({ mutationFn: api.reactivateClient, onSuccess: invalidate });

  function openCreate() {
    setEditing(null);
    setFormError(null);
    setDialogOpen(true);
  }
  function openEdit(client: Client) {
    setEditing(client);
    setFormError(null);
    setDialogOpen(true);
  }
  async function handleSubmit(values: api.ClientFormValues) {
    setFormError(null);
    if (editing) await updateMutation.mutateAsync({ id: editing.id, values });
    else await createMutation.mutateAsync(values);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Clients</h1>
          <p className="text-muted-foreground">Particuliers, entreprises, maîtres d'ouvrage publics.</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Nouveau client
        </Button>
      </div>

      {resume && resume.total > 0 && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Clients actifs</p>
                <p className="text-xl font-semibold leading-tight">{resume.total}</p>
              </div>
            </CardContent>
          </Card>
          {(
            [
              ['ENTREPRISE', 'Entreprises', Building2],
              ['PARTICULIER', 'Particuliers', User],
              ['MAITRE_OUVRAGE_PUBLIC', "Maîtres d'ouvrage publics", Landmark],
            ] as [TypeClient, string, typeof Building2][]
          ).map(([type, label, Icon]) => (
            <Card key={type}>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">{label}</p>
                  <p className="text-xl font-semibold leading-tight">
                    {resume.parType.find((t) => t.type === type)?.nombre ?? 0}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-72 max-w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher (nom, ICE, ville)…"
            className="pl-9"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={showInactifs}
            onChange={(e) => {
              setShowInactifs(e.target.checked);
              setPage(1);
            }}
          />
          Afficher les clients désactivés
        </label>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Ville</TableHead>
              <TableHead>ICE</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Chargement…
                </TableCell>
              </TableRow>
            )}
            {!isLoading && data?.items.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Aucun client.
                </TableCell>
              </TableRow>
            )}
            {data?.items.map((client) => (
              <TableRow key={client.id}>
                <TableCell className="font-medium">
                  <button className="hover:underline" onClick={() => openEdit(client)}>
                    {client.nom}
                  </button>
                  {client.contactNom && <div className="text-xs text-muted-foreground">{client.contactNom}</div>}
                </TableCell>
                <TableCell>{TYPE_CLIENT_LABELS[client.type]}</TableCell>
                <TableCell>{client.ville || '—'}</TableCell>
                <TableCell>{client.ice || '—'}</TableCell>
                <TableCell>
                  <Badge variant={client.actif ? 'default' : 'secondary'}>{client.actif ? 'Actif' : 'Désactivé'}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  {client.actif ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1 text-destructive hover:text-destructive"
                      onClick={() => deactivateMutation.mutate(client.id)}
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Désactiver
                    </Button>
                  ) : (
                    <Button variant="ghost" size="sm" className="gap-1" onClick={() => reactivateMutation.mutate(client.id)}>
                      <RotateCcw className="h-3.5 w-3.5" />
                      Réactiver
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {data && <PaginationBar page={data.page} totalPages={data.totalPages} total={data.total} onPageChange={setPage} />}

      <ClientFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        client={editing}
        onSubmit={handleSubmit}
        submitting={createMutation.isPending || updateMutation.isPending}
        error={formError}
      />
    </div>
  );
}
