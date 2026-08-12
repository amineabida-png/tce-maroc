import { apiFetch } from '@/lib/api';
import type { Paginated } from '@/lib/types';
import type { SousTraitant } from './types';

export interface SousTraitantFormValues {
  nom: string;
  corpsDetat: string;
  contactNom: string;
  ice: string;
  rc: string;
  identifiantFiscal: string;
  adresse: string;
  ville: string;
  telephone: string;
  email: string;
  evaluation: string;
  notes: string;
}

export function fetchSousTraitants(params: { q?: string; page?: number; includeInactifs?: boolean }) {
  const qs = new URLSearchParams();
  if (params.q) qs.set('q', params.q);
  if (params.page) qs.set('page', String(params.page));
  if (params.includeInactifs) qs.set('includeInactifs', 'true');
  return apiFetch<Paginated<SousTraitant>>(`/api/sous-traitants?${qs.toString()}`);
}

function toPayload(values: SousTraitantFormValues) {
  return { ...values, evaluation: values.evaluation ? Number(values.evaluation) : null };
}

export function createSousTraitant(values: SousTraitantFormValues) {
  return apiFetch<SousTraitant>('/api/sous-traitants', { method: 'POST', body: JSON.stringify(toPayload(values)) });
}

export function updateSousTraitant(id: string, values: SousTraitantFormValues) {
  return apiFetch<SousTraitant>(`/api/sous-traitants/${id}`, { method: 'PUT', body: JSON.stringify(toPayload(values)) });
}

export function deactivateSousTraitant(id: string) {
  return apiFetch<SousTraitant>(`/api/sous-traitants/${id}/desactiver`, { method: 'POST' });
}

export function reactivateSousTraitant(id: string) {
  return apiFetch<SousTraitant>(`/api/sous-traitants/${id}/reactiver`, { method: 'POST' });
}
