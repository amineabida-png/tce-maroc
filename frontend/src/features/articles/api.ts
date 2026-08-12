import { apiFetch } from '@/lib/api';
import type { Paginated } from '@/lib/types';
import type { Article, ArticleDetail } from './types';

export interface ArticleFormValues {
  nom: string;
  categorie: string;
  unite: string;
  seuilAlerte: string;
}

function toPayload(values: ArticleFormValues) {
  return { ...values, seuilAlerte: values.seuilAlerte ? Number(values.seuilAlerte) : null };
}

export function fetchArticles(params: { q?: string; page?: number; includeInactifs?: boolean; sousSeuil?: boolean }) {
  const qs = new URLSearchParams();
  if (params.q) qs.set('q', params.q);
  if (params.page) qs.set('page', String(params.page));
  if (params.includeInactifs) qs.set('includeInactifs', 'true');
  if (params.sousSeuil) qs.set('sousSeuil', 'true');
  return apiFetch<Paginated<Article>>(`/api/articles?${qs.toString()}`);
}

export function fetchArticle(id: string) {
  return apiFetch<ArticleDetail>(`/api/articles/${id}`);
}

export function createArticle(values: ArticleFormValues) {
  return apiFetch<Article>('/api/articles', { method: 'POST', body: JSON.stringify(toPayload(values)) });
}
export function updateArticle(id: string, values: ArticleFormValues) {
  return apiFetch<Article>(`/api/articles/${id}`, { method: 'PUT', body: JSON.stringify(toPayload(values)) });
}
export function deactivateArticle(id: string) {
  return apiFetch<Article>(`/api/articles/${id}/desactiver`, { method: 'POST' });
}
export function reactivateArticle(id: string) {
  return apiFetch<Article>(`/api/articles/${id}/reactiver`, { method: 'POST' });
}
