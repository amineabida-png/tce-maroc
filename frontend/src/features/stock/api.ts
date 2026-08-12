import { apiFetch } from '@/lib/api';
import type { Paginated } from '@/lib/types';
import type { Mouvement } from './types';

export interface SortieFormValues {
  articleId: string;
  quantite: string;
  chantierId: string;
  date: string;
  notes: string;
}

export function fetchMouvements(params: { page?: number; articleId?: string; chantierId?: string; type?: string }) {
  const qs = new URLSearchParams();
  if (params.page) qs.set('page', String(params.page));
  if (params.articleId) qs.set('articleId', params.articleId);
  if (params.chantierId) qs.set('chantierId', params.chantierId);
  if (params.type) qs.set('type', params.type);
  return apiFetch<Paginated<Mouvement>>(`/api/mouvements-stock?${qs.toString()}`);
}

export function createSortie(values: SortieFormValues) {
  return apiFetch<Mouvement>('/api/mouvements-stock/sortie', {
    method: 'POST',
    body: JSON.stringify({ ...values, quantite: Number(values.quantite) }),
  });
}
