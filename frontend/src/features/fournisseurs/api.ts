import { apiFetch } from '@/lib/api';
import type { Paginated } from '@/lib/types';
import type { Fournisseur } from './types';

export interface FournisseurFormValues {
  nom: string;
  categorie: string;
  contactNom: string;
  ice: string;
  rc: string;
  identifiantFiscal: string;
  adresse: string;
  ville: string;
  telephone: string;
  email: string;
  evaluation: string; // '' ou '1'..'5', converti au niveau du service
  notes: string;
}

export function fetchFournisseurs(params: { q?: string; page?: number; includeInactifs?: boolean }) {
  const qs = new URLSearchParams();
  if (params.q) qs.set('q', params.q);
  if (params.page) qs.set('page', String(params.page));
  if (params.includeInactifs) qs.set('includeInactifs', 'true');
  return apiFetch<Paginated<Fournisseur>>(`/api/fournisseurs?${qs.toString()}`);
}

function toPayload(values: FournisseurFormValues) {
  return { ...values, evaluation: values.evaluation ? Number(values.evaluation) : null };
}

export function createFournisseur(values: FournisseurFormValues) {
  return apiFetch<Fournisseur>('/api/fournisseurs', { method: 'POST', body: JSON.stringify(toPayload(values)) });
}

export function updateFournisseur(id: string, values: FournisseurFormValues) {
  return apiFetch<Fournisseur>(`/api/fournisseurs/${id}`, { method: 'PUT', body: JSON.stringify(toPayload(values)) });
}

export function deactivateFournisseur(id: string) {
  return apiFetch<Fournisseur>(`/api/fournisseurs/${id}/desactiver`, { method: 'POST' });
}

export function reactivateFournisseur(id: string) {
  return apiFetch<Fournisseur>(`/api/fournisseurs/${id}/reactiver`, { method: 'POST' });
}
