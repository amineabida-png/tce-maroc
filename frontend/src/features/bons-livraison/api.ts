import { apiFetch } from '@/lib/api';
import type { Paginated } from '@/lib/types';
import type { BonLivraison, BonLivraisonSummary } from './types';

export interface LigneContent {
  designation: string;
  unite: string;
  quantiteCommandee: string;
  quantiteLivree: string;
  observations: string;
}
export interface BonLivraisonContent {
  clientId: string;
  chantierId: string;
  commandeId: string;
  lieuLivraison: string;
  notes: string;
  lignes: LigneContent[];
}

function toPayload(content: BonLivraisonContent) {
  return {
    clientId: content.clientId,
    chantierId: content.chantierId || undefined,
    commandeId: content.commandeId || undefined,
    lieuLivraison: content.lieuLivraison || undefined,
    notes: content.notes || undefined,
    lignes: content.lignes.map((l) => ({
      designation: l.designation,
      unite: l.unite,
      quantiteCommandee: l.quantiteCommandee ? Number(l.quantiteCommandee) : undefined,
      quantiteLivree: Number(l.quantiteLivree),
      observations: l.observations || undefined,
    })),
  };
}

export function fetchList(params: { q?: string; page?: number }) {
  const qs = new URLSearchParams();
  if (params.q) qs.set('q', params.q);
  if (params.page) qs.set('page', String(params.page));
  return apiFetch<Paginated<BonLivraisonSummary>>(`/api/bons-livraison?${qs.toString()}`);
}

export interface ResumeBonsLivraison {
  total: number;
  recents: number;
}
export function fetchResume() {
  return apiFetch<ResumeBonsLivraison>('/api/bons-livraison/resume');
}

export function fetchOne(id: string) {
  return apiFetch<BonLivraison>(`/api/bons-livraison/${id}`);
}

export function create(content: BonLivraisonContent) {
  return apiFetch<BonLivraison>('/api/bons-livraison', { method: 'POST', body: JSON.stringify(toPayload(content)) });
}

export function update(id: string, content: BonLivraisonContent) {
  return apiFetch<BonLivraison>(`/api/bons-livraison/${id}`, { method: 'PUT', body: JSON.stringify(toPayload(content)) });
}

export function remove(id: string) {
  return apiFetch<void>(`/api/bons-livraison/${id}`, { method: 'DELETE' });
}
