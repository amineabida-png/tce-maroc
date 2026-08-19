import { apiFetch } from '@/lib/api';
import type { Paginated } from '@/lib/types';
import type { Situation, SituationSummary, StatutSituation } from './types';

export interface LigneContent {
  designation: string;
  unite: string;
  quantiteMarche: string;
  prixUnitaire: string;
  avancementCumulePourcent: string;
}
export interface SituationContent {
  commandeId: string;
  contratSousTraitantId: string;
  chantierId: string;
  tauxTva: string;
  tauxRetenueGarantie: string;
  lignes: LigneContent[];
}

function toPayload(content: SituationContent) {
  return {
    commandeId: content.commandeId || undefined,
    contratSousTraitantId: content.contratSousTraitantId || undefined,
    chantierId: content.chantierId || undefined,
    tauxTva: content.tauxTva ? Number(content.tauxTva) : undefined,
    tauxRetenueGarantie: content.tauxRetenueGarantie ? Number(content.tauxRetenueGarantie) : undefined,
    lignes: content.lignes.map((l) => ({
      designation: l.designation,
      unite: l.unite,
      quantiteMarche: Number(l.quantiteMarche),
      prixUnitaire: Number(l.prixUnitaire),
      avancementCumulePourcent: Number(l.avancementCumulePourcent),
    })),
  };
}

export function fetchList(params: { q?: string; page?: number; statut?: string; commandeId?: string; contratSousTraitantId?: string }) {
  const qs = new URLSearchParams();
  if (params.q) qs.set('q', params.q);
  if (params.page) qs.set('page', String(params.page));
  if (params.statut) qs.set('statut', params.statut);
  if (params.commandeId) qs.set('commandeId', params.commandeId);
  if (params.contratSousTraitantId) qs.set('contratSousTraitantId', params.contratSousTraitantId);
  return apiFetch<Paginated<SituationSummary>>(`/api/situations?${qs.toString()}`);
}

export interface ResumeSituations {
  total: number;
  montantEnAttente: number;
}
export function fetchResume() {
  return apiFetch<ResumeSituations>('/api/situations/resume');
}

export interface EtatMarcheLigne {
  designation: string;
  unite: string;
  quantiteMarche: number;
  prixUnitaire: number;
  avancementPrecedent: number;
}
export interface EtatMarche {
  tauxTva: number;
  chantierId: string | null;
  lignes: EtatMarcheLigne[];
}
export function fetchEtatMarche(field: 'commandeId' | 'contratSousTraitantId', id: string) {
  const qs = new URLSearchParams({ [field]: id });
  return apiFetch<EtatMarche>(`/api/situations/etat-marche?${qs.toString()}`);
}

export function fetchOne(id: string) {
  return apiFetch<Situation>(`/api/situations/${id}`);
}

export function create(content: SituationContent) {
  return apiFetch<Situation>('/api/situations', { method: 'POST', body: JSON.stringify(toPayload(content)) });
}

export function update(id: string, content: SituationContent) {
  return apiFetch<Situation>(`/api/situations/${id}`, { method: 'PUT', body: JSON.stringify(toPayload(content)) });
}

export function remove(id: string) {
  return apiFetch<void>(`/api/situations/${id}`, { method: 'DELETE' });
}

export function changeStatut(id: string, statut: StatutSituation) {
  return apiFetch<Situation>(`/api/situations/${id}/statut`, { method: 'POST', body: JSON.stringify({ statut }) });
}
