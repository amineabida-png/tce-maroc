import { apiFetch } from '@/lib/api';
import type { Paginated } from '@/lib/types';
import type { CommandeFournisseurDetail, CommandeFournisseurSummary, StatutCommandeFournisseur } from './types';

export interface LigneContent {
  articleId: string;
  designation: string;
  unite: string;
  quantiteCommandee: string;
  prixUnitaire: string;
}
export interface CommandeFournisseurContent {
  fournisseurId: string;
  chantierId: string;
  tauxTva: string;
  lignes: LigneContent[];
}

function toPayload(content: CommandeFournisseurContent) {
  return {
    fournisseurId: content.fournisseurId,
    chantierId: content.chantierId || undefined,
    tauxTva: content.tauxTva ? Number(content.tauxTva) : undefined,
    lignes: content.lignes.map((l) => ({
      ...l,
      articleId: l.articleId || undefined,
      quantiteCommandee: Number(l.quantiteCommandee),
      prixUnitaire: Number(l.prixUnitaire),
    })),
  };
}

export function fetchList(params: { q?: string; page?: number; statut?: string }) {
  const qs = new URLSearchParams();
  if (params.q) qs.set('q', params.q);
  if (params.page) qs.set('page', String(params.page));
  if (params.statut) qs.set('statut', params.statut);
  return apiFetch<Paginated<CommandeFournisseurSummary>>(`/api/commandes-fournisseur?${qs.toString()}`);
}

export function fetchOne(id: string) {
  return apiFetch<CommandeFournisseurDetail>(`/api/commandes-fournisseur/${id}`);
}

export function create(content: CommandeFournisseurContent) {
  return apiFetch<CommandeFournisseurDetail>('/api/commandes-fournisseur', { method: 'POST', body: JSON.stringify(toPayload(content)) });
}

export function update(id: string, content: CommandeFournisseurContent) {
  return apiFetch<CommandeFournisseurDetail>(`/api/commandes-fournisseur/${id}`, {
    method: 'PUT',
    body: JSON.stringify(toPayload(content)),
  });
}

export function remove(id: string) {
  return apiFetch<void>(`/api/commandes-fournisseur/${id}`, { method: 'DELETE' });
}

export function changeStatut(id: string, statut: StatutCommandeFournisseur) {
  return apiFetch<CommandeFournisseurDetail>(`/api/commandes-fournisseur/${id}/statut`, {
    method: 'POST',
    body: JSON.stringify({ statut }),
  });
}

export function receptionner(id: string, lignes: { ligneId: string; quantiteRecue: number }[]) {
  return apiFetch<CommandeFournisseurDetail>(`/api/commandes-fournisseur/${id}/reception`, {
    method: 'POST',
    body: JSON.stringify({ lignes }),
  });
}
