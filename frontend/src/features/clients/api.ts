import { apiFetch } from '@/lib/api';
import type { Paginated } from '@/lib/types';
import type { Client } from './types';

export interface ClientFormValues {
  type: string;
  nom: string;
  contactNom: string;
  ice: string;
  rc: string;
  identifiantFiscal: string;
  adresse: string;
  ville: string;
  telephone: string;
  email: string;
  notes: string;
}

export function fetchClients(params: { q?: string; page?: number; includeInactifs?: boolean }) {
  const qs = new URLSearchParams();
  if (params.q) qs.set('q', params.q);
  if (params.page) qs.set('page', String(params.page));
  if (params.includeInactifs) qs.set('includeInactifs', 'true');
  return apiFetch<Paginated<Client>>(`/api/clients?${qs.toString()}`);
}

export function createClient(data: ClientFormValues) {
  return apiFetch<Client>('/api/clients', { method: 'POST', body: JSON.stringify(data) });
}

export function updateClient(id: string, data: ClientFormValues) {
  return apiFetch<Client>(`/api/clients/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export function deactivateClient(id: string) {
  return apiFetch<Client>(`/api/clients/${id}/desactiver`, { method: 'POST' });
}

export function reactivateClient(id: string) {
  return apiFetch<Client>(`/api/clients/${id}/reactiver`, { method: 'POST' });
}
