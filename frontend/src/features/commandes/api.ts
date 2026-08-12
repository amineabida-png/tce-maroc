import { apiFetch } from '@/lib/api';
import type { Paginated } from '@/lib/types';
import type { Commande, CommandeSummary, StatutCommande } from './types';

export interface LigneContent {
  designation: string;
  unite: string;
  quantite: string;
  prixUnitaire: string;
}
export interface CommandeContent {
  clientId: string;
  chantierId: string;
  tauxTva: string;
  lignes: LigneContent[];
}

function toPayload(content: CommandeContent) {
  return {
    clientId: content.clientId,
    chantierId: content.chantierId || undefined,
    tauxTva: content.tauxTva ? Number(content.tauxTva) : undefined,
    lignes: content.lignes.map((l) => ({ ...l, quantite: Number(l.quantite), prixUnitaire: Number(l.prixUnitaire) })),
  };
}

export function fetchCommandesList(params: { q?: string; page?: number; statut?: string }) {
  const qs = new URLSearchParams();
  if (params.q) qs.set('q', params.q);
  if (params.page) qs.set('page', String(params.page));
  if (params.statut) qs.set('statut', params.statut);
  return apiFetch<Paginated<CommandeSummary>>(`/api/commandes?${qs.toString()}`);
}

export function fetchCommande(id: string) {
  return apiFetch<Commande>(`/api/commandes/${id}`);
}

export function createCommande(content: CommandeContent) {
  return apiFetch<Commande>('/api/commandes', { method: 'POST', body: JSON.stringify(toPayload(content)) });
}

export function updateCommande(id: string, content: CommandeContent) {
  return apiFetch<Commande>(`/api/commandes/${id}`, { method: 'PUT', body: JSON.stringify(toPayload(content)) });
}

export function deleteCommande(id: string) {
  return apiFetch<void>(`/api/commandes/${id}`, { method: 'DELETE' });
}

export function changeStatutCommande(id: string, statut: StatutCommande) {
  return apiFetch<Commande>(`/api/commandes/${id}/statut`, { method: 'POST', body: JSON.stringify({ statut }) });
}

export function convertirEnFacture(id: string) {
  return apiFetch<{ id: string }>(`/api/commandes/${id}/convertir-facture`, { method: 'POST' });
}
