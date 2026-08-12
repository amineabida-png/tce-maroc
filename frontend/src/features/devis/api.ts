import { apiFetch } from '@/lib/api';
import type { Paginated } from '@/lib/types';
import type { Devis, DevisSummary, StatutDevis } from './types';

export interface LigneContent {
  designation: string;
  unite: string;
  quantite: string;
  prixUnitaire: string;
}
export interface LotContent {
  nom: string;
  lignes: LigneContent[];
}
export interface DevisContent {
  clientId: string;
  chantierId: string;
  dateValidite: string;
  tauxTva: string;
  conditions: string;
  lots: LotContent[];
  lignesSansLot: LigneContent[];
}

function toPayload(content: DevisContent) {
  return {
    clientId: content.clientId,
    chantierId: content.chantierId || undefined,
    dateValidite: content.dateValidite || undefined,
    tauxTva: content.tauxTva ? Number(content.tauxTva) : undefined,
    conditions: content.conditions || undefined,
    lots: content.lots.map((lot) => ({
      nom: lot.nom,
      lignes: lot.lignes.map((l) => ({ ...l, quantite: Number(l.quantite), prixUnitaire: Number(l.prixUnitaire) })),
    })),
    lignesSansLot: content.lignesSansLot.map((l) => ({ ...l, quantite: Number(l.quantite), prixUnitaire: Number(l.prixUnitaire) })),
  };
}

export function fetchDevisList(params: { q?: string; page?: number; statut?: string }) {
  const qs = new URLSearchParams();
  if (params.q) qs.set('q', params.q);
  if (params.page) qs.set('page', String(params.page));
  if (params.statut) qs.set('statut', params.statut);
  return apiFetch<Paginated<DevisSummary>>(`/api/devis?${qs.toString()}`);
}

export function fetchDevis(id: string) {
  return apiFetch<Devis>(`/api/devis/${id}`);
}

export function createDevis(content: DevisContent) {
  return apiFetch<Devis>('/api/devis', { method: 'POST', body: JSON.stringify(toPayload(content)) });
}

export function updateDevis(id: string, content: DevisContent) {
  return apiFetch<Devis>(`/api/devis/${id}`, { method: 'PUT', body: JSON.stringify(toPayload(content)) });
}

export function deleteDevis(id: string) {
  return apiFetch<void>(`/api/devis/${id}`, { method: 'DELETE' });
}

export function changeStatutDevis(id: string, statut: StatutDevis) {
  return apiFetch<Devis>(`/api/devis/${id}/statut`, { method: 'POST', body: JSON.stringify({ statut }) });
}

export function convertirEnCommande(id: string) {
  return apiFetch<{ id: string }>(`/api/devis/${id}/convertir-commande`, { method: 'POST' });
}
