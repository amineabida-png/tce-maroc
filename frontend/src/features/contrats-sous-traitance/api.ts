import { apiFetch } from '@/lib/api';
import type { Paginated } from '@/lib/types';
import type { ContratSousTraitantDetail, ContratSousTraitantSummary, StatutContratSousTraitant } from './types';

export interface LigneContent {
  designation: string;
  unite: string;
  quantite: string;
  prixUnitaire: string;
}
export interface ContratSousTraitantContent {
  sousTraitantId: string;
  chantierId: string;
  tauxTva: string;
  lignes: LigneContent[];
}

function toPayload(content: ContratSousTraitantContent) {
  return {
    sousTraitantId: content.sousTraitantId,
    chantierId: content.chantierId || undefined,
    tauxTva: content.tauxTva ? Number(content.tauxTva) : undefined,
    lignes: content.lignes.map((l) => ({ ...l, quantite: Number(l.quantite), prixUnitaire: Number(l.prixUnitaire) })),
  };
}

export function fetchList(params: { q?: string; page?: number; statut?: string }) {
  const qs = new URLSearchParams();
  if (params.q) qs.set('q', params.q);
  if (params.page) qs.set('page', String(params.page));
  if (params.statut) qs.set('statut', params.statut);
  return apiFetch<Paginated<ContratSousTraitantSummary>>(`/api/contrats-sous-traitance?${qs.toString()}`);
}

export interface ResumeContratsSousTraitance {
  total: number;
  montantEngage: number;
}
export function fetchResume() {
  return apiFetch<ResumeContratsSousTraitance>('/api/contrats-sous-traitance/resume');
}

export function fetchOne(id: string) {
  return apiFetch<ContratSousTraitantDetail>(`/api/contrats-sous-traitance/${id}`);
}

export function create(content: ContratSousTraitantContent) {
  return apiFetch<ContratSousTraitantDetail>('/api/contrats-sous-traitance', { method: 'POST', body: JSON.stringify(toPayload(content)) });
}

export function update(id: string, content: ContratSousTraitantContent) {
  return apiFetch<ContratSousTraitantDetail>(`/api/contrats-sous-traitance/${id}`, { method: 'PUT', body: JSON.stringify(toPayload(content)) });
}

export function remove(id: string) {
  return apiFetch<void>(`/api/contrats-sous-traitance/${id}`, { method: 'DELETE' });
}

export function changeStatut(id: string, statut: StatutContratSousTraitant) {
  return apiFetch<ContratSousTraitantDetail>(`/api/contrats-sous-traitance/${id}/statut`, { method: 'POST', body: JSON.stringify({ statut }) });
}
