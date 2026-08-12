import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { KeyRound, Plus, RotateCcw, Search, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ApiError } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import * as api from './api';
import { ResetPasswordDialog } from './ResetPasswordDialog';
import { ROLE_LABELS, type Utilisateur } from './types';
import { UtilisateurFormDialog } from './UtilisateurFormDialog';

export function UtilisateursTab() {
  const queryClient = useQueryClient();
  const currentUserId = useAuthStore((s) => s.user?.id);
  const [q, setQ] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Utilisateur | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState<Utilisateur | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['utilisateurs-admin', q],
    queryFn: () => api.fetchUtilisateurs({ q, includeInactifs: true }),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['utilisateurs-admin'] });

  const createMutation = useMutation({
    mutationFn: api.createUtilisateur,
    onSuccess: () => {
      invalidate();
      setDialogOpen(false);
    },
    onError: (err) => setFormError(err instanceof ApiError ? err.message : 'Erreur inattendue.'),
  });
  const updateMutation = useMutation({
    mutationFn: (vars: { id: string; values: api.UpdateUtilisateurValues }) => api.updateUtilisateur(vars.id, vars.values),
    onSuccess: () => {
      invalidate();
      setDialogOpen(false);
    },
    onError: (err) => setFormError(err instanceof ApiError ? err.message : 'Erreur inattendue.'),
  });
  const deactivateMutation = useMutation({
    mutationFn: api.deactivateUtilisateur,
    onSuccess: invalidate,
    onError: (err) => setFormError(err instanceof ApiError ? err.message : 'Erreur inattendue.'),
  });
  const reactivateMutation = useMutation({ mutationFn: api.reactivateUtilisateur, onSuccess: invalidate });
  const resetMutation = useMutation({
    mutationFn: (vars: { id: string; motDePasse: string }) => api.reinitialiserMotDePasse(vars.id, vars.motDePasse),
    onSuccess: () => setResetDialogOpen(false),
    onError: (err) => setResetError(err instanceof ApiError ? err.message : 'Erreur inattendue.'),
  });

  function openCreate() {
    setEditing(null);
    setFormError(null);
    setDialogOpen(true);
  }
  function openEdit(u: Utilisateur) {
    setEditing(u);
    setFormError(null);
    setDialogOpen(true);
  }
  function openReset(u: Utilisateur) {
    setResetTarget(u);
    setResetError(null);
    setResetDialogOpen(true);
  }
  async function handleSubmit(values: api.UtilisateurFormValues) {
    setFormError(null);
    if (editing) await updateMutation.mutateAsync({ id: editing.id, values: { email: values.email, nom: values.nom, prenom: values.prenom, role: values.role } });
    else await createMutation.mutateAsync(values);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-72 max-w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Rechercher (nom, email)…" className="pl-9" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Nouvel utilisateur
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Utilisateur</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rôle</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Chargement…
                </TableCell>
              </TableRow>
            )}
            {!isLoading && data?.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Aucun utilisateur.
                </TableCell>
              </TableRow>
            )}
            {data?.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">
                  <button className="hover:underline" onClick={() => openEdit(u)}>
                    {u.nom} {u.prenom}
                  </button>
                </TableCell>
                <TableCell className="text-muted-foreground">{u.email}</TableCell>
                <TableCell>{ROLE_LABELS[u.role]}</TableCell>
                <TableCell>
                  <Badge variant={u.actif ? 'outline' : 'secondary'}>{u.actif ? 'Actif' : 'Désactivé'}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="sm" className="gap-1" onClick={() => openReset(u)}>
                      <KeyRound className="h-3.5 w-3.5" />
                      Mot de passe
                    </Button>
                    {u.actif ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1 text-destructive hover:text-destructive"
                        disabled={u.id === currentUserId}
                        title={u.id === currentUserId ? 'Vous ne pouvez pas désactiver votre propre compte' : undefined}
                        onClick={() => deactivateMutation.mutate(u.id)}
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Désactiver
                      </Button>
                    ) : (
                      <Button variant="ghost" size="sm" className="gap-1" onClick={() => reactivateMutation.mutate(u.id)}>
                        <RotateCcw className="h-3.5 w-3.5" />
                        Réactiver
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <UtilisateurFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        utilisateur={editing}
        onSubmit={handleSubmit}
        submitting={createMutation.isPending || updateMutation.isPending}
        error={formError}
      />
      <ResetPasswordDialog
        open={resetDialogOpen}
        onOpenChange={setResetDialogOpen}
        utilisateur={resetTarget}
        onSubmit={(motDePasse) => resetMutation.mutateAsync({ id: resetTarget!.id, motDePasse })}
        submitting={resetMutation.isPending}
        error={resetError}
      />
    </div>
  );
}
