import { apiFetch } from '@/lib/api';
import type { Paginated } from '@/lib/types';
import type { BudgetSummary, Chantier, ChantierSummary, DepenseChantier, TacheChantier } from './types';

export interface ChantierFormValues {
  nom: string;
  clientId: string;
  adresse: string;
  ville: string;
  budgetPrevisionnel: string; // saisi comme texte, converti en nombre
  dateDebut: string;
  dateFinPrevue: string;
  dateFinReelle: string;
  avancement: number;
  statut: string;
  conducteurId: string;
  description: string;
}

function toChantierPayload(values: ChantierFormValues) {
  return { ...values, budgetPrevisionnel: values.budgetPrevisionnel ? Number(values.budgetPrevisionnel) : null };
}

export function fetchChantiers(params: { q?: string; page?: number; statut?: string; includeInactifs?: boolean }) {
  const qs = new URLSearchParams();
  if (params.q) qs.set('q', params.q);
  if (params.page) qs.set('page', String(params.page));
  if (params.statut) qs.set('statut', params.statut);
  if (params.includeInactifs) qs.set('includeInactifs', 'true');
  return apiFetch<Paginated<ChantierSummary>>(`/api/chantiers?${qs.toString()}`);
}

export function fetchChantier(id: string) {
  return apiFetch<Chantier>(`/api/chantiers/${id}`);
}

export function createChantier(values: ChantierFormValues) {
  return apiFetch<Chantier>('/api/chantiers', { method: 'POST', body: JSON.stringify(toChantierPayload(values)) });
}

export function updateChantier(id: string, values: ChantierFormValues) {
  return apiFetch<Chantier>(`/api/chantiers/${id}`, { method: 'PUT', body: JSON.stringify(toChantierPayload(values)) });
}

export function deactivateChantier(id: string) {
  return apiFetch<Chantier>(`/api/chantiers/${id}/desactiver`, { method: 'POST' });
}

export function reactivateChantier(id: string) {
  return apiFetch<Chantier>(`/api/chantiers/${id}/reactiver`, { method: 'POST' });
}

export function fetchBudgetSummary(chantierId: string) {
  return apiFetch<BudgetSummary>(`/api/chantiers/${chantierId}/budget`);
}

export interface TacheFormValues {
  nom: string;
  dateDebut: string;
  dateFin: string;
  avancement: number;
  statut: string;
  ordre: number;
  predecesseurId: string;
}

export function fetchTaches(chantierId: string) {
  return apiFetch<TacheChantier[]>(`/api/chantiers/${chantierId}/taches`);
}
export function createTache(chantierId: string, values: TacheFormValues) {
  return apiFetch<TacheChantier>(`/api/chantiers/${chantierId}/taches`, { method: 'POST', body: JSON.stringify(values) });
}
export function updateTache(chantierId: string, tacheId: string, values: TacheFormValues) {
  return apiFetch<TacheChantier>(`/api/chantiers/${chantierId}/taches/${tacheId}`, {
    method: 'PUT',
    body: JSON.stringify(values),
  });
}
export function deleteTache(chantierId: string, tacheId: string) {
  return apiFetch<void>(`/api/chantiers/${chantierId}/taches/${tacheId}`, { method: 'DELETE' });
}

export interface DepenseFormValues {
  categorie: string;
  montant: string;
  date: string;
  description: string;
  fournisseurId: string;
  sousTraitantId: string;
}

export function fetchDepenses(chantierId: string) {
  return apiFetch<DepenseChantier[]>(`/api/chantiers/${chantierId}/depenses`);
}
export function createDepense(chantierId: string, values: DepenseFormValues) {
  return apiFetch<DepenseChantier>(`/api/chantiers/${chantierId}/depenses`, {
    method: 'POST',
    body: JSON.stringify({ ...values, montant: Number(values.montant) }),
  });
}
export function deleteDepense(chantierId: string, depenseId: string) {
  return apiFetch<void>(`/api/chantiers/${chantierId}/depenses/${depenseId}`, { method: 'DELETE' });
}
