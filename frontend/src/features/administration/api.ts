import { apiFetch } from '@/lib/api';
import type { Paginated } from '@/lib/types';
import type { JournalAuditEntry, Role, Utilisateur } from './types';

export interface UtilisateurFormValues {
  email: string;
  motDePasse: string;
  nom: string;
  prenom: string;
  role: Role;
}
export type UpdateUtilisateurValues = Omit<UtilisateurFormValues, 'motDePasse'>;

export function fetchUtilisateurs(params: { q?: string; includeInactifs?: boolean }) {
  const qs = new URLSearchParams();
  if (params.q) qs.set('q', params.q);
  if (params.includeInactifs) qs.set('includeInactifs', 'true');
  return apiFetch<Utilisateur[]>(`/api/utilisateurs?${qs.toString()}`);
}
export function createUtilisateur(values: UtilisateurFormValues) {
  return apiFetch<Utilisateur>('/api/utilisateurs', { method: 'POST', body: JSON.stringify(values) });
}
export function updateUtilisateur(id: string, values: UpdateUtilisateurValues) {
  return apiFetch<Utilisateur>(`/api/utilisateurs/${id}`, { method: 'PUT', body: JSON.stringify(values) });
}
export function deactivateUtilisateur(id: string) {
  return apiFetch<Utilisateur>(`/api/utilisateurs/${id}/desactiver`, { method: 'POST' });
}
export function reactivateUtilisateur(id: string) {
  return apiFetch<Utilisateur>(`/api/utilisateurs/${id}/reactiver`, { method: 'POST' });
}
export function reinitialiserMotDePasse(id: string, nouveauMotDePasse: string) {
  return apiFetch<void>(`/api/utilisateurs/${id}/reinitialiser-mot-de-passe`, {
    method: 'POST',
    body: JSON.stringify({ nouveauMotDePasse }),
  });
}

export function fetchJournalAudit(params: { page?: number; utilisateurId?: string; action?: string; entite?: string }) {
  const qs = new URLSearchParams();
  if (params.page) qs.set('page', String(params.page));
  if (params.utilisateurId) qs.set('utilisateurId', params.utilisateurId);
  if (params.action) qs.set('action', params.action);
  if (params.entite) qs.set('entite', params.entite);
  return apiFetch<Paginated<JournalAuditEntry>>(`/api/administration/journal-audit?${qs.toString()}`);
}
export function fetchActionsDistinctes() {
  return apiFetch<string[]>('/api/administration/journal-audit/actions');
}
