import { apiFetch } from '@/lib/api';
import type { Paginated } from '@/lib/types';
import type { Ouvrage } from './types';

export interface OuvrageFormValues {
  corpsDetat: string;
  designation: string;
  unite: string;
  prixUnitaireDefaut: string;
}

function toPayload(values: OuvrageFormValues) {
  return { ...values, prixUnitaireDefaut: Number(values.prixUnitaireDefaut) };
}

export function fetchOuvrages(params: { q?: string; page?: number; includeInactifs?: boolean }) {
  const qs = new URLSearchParams();
  if (params.q) qs.set('q', params.q);
  if (params.page) qs.set('page', String(params.page));
  if (params.includeInactifs) qs.set('includeInactifs', 'true');
  return apiFetch<Paginated<Ouvrage>>(`/api/ouvrages?${qs.toString()}`);
}

export function createOuvrage(values: OuvrageFormValues) {
  return apiFetch<Ouvrage>('/api/ouvrages', { method: 'POST', body: JSON.stringify(toPayload(values)) });
}
export function updateOuvrage(id: string, values: OuvrageFormValues) {
  return apiFetch<Ouvrage>(`/api/ouvrages/${id}`, { method: 'PUT', body: JSON.stringify(toPayload(values)) });
}
export function deactivateOuvrage(id: string) {
  return apiFetch<Ouvrage>(`/api/ouvrages/${id}/desactiver`, { method: 'POST' });
}
export function reactivateOuvrage(id: string) {
  return apiFetch<Ouvrage>(`/api/ouvrages/${id}/reactiver`, { method: 'POST' });
}
