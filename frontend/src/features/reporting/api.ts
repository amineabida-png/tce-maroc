import { apiDownload, apiFetch } from '@/lib/api';
import type { LigneMargeChantier, RapportCA, RapportImpayes, RapportStock } from './types';

export function fetchCA(params: { debut?: string; fin?: string }) {
  const qs = new URLSearchParams();
  if (params.debut) qs.set('debut', params.debut);
  if (params.fin) qs.set('fin', params.fin);
  return apiFetch<RapportCA>(`/api/reporting/ca?${qs.toString()}`);
}
export function exportCA(params: { debut?: string; fin?: string }) {
  const qs = new URLSearchParams();
  if (params.debut) qs.set('debut', params.debut);
  if (params.fin) qs.set('fin', params.fin);
  return apiDownload(`/api/reporting/ca/export?${qs.toString()}`, 'chiffre_affaires.csv');
}

export function fetchMargeChantiers(params: { debut?: string; fin?: string }) {
  const qs = new URLSearchParams();
  if (params.debut) qs.set('debut', params.debut);
  if (params.fin) qs.set('fin', params.fin);
  return apiFetch<LigneMargeChantier[]>(`/api/reporting/marge-chantiers?${qs.toString()}`);
}
export function exportMargeChantiers(params: { debut?: string; fin?: string }) {
  const qs = new URLSearchParams();
  if (params.debut) qs.set('debut', params.debut);
  if (params.fin) qs.set('fin', params.fin);
  return apiDownload(`/api/reporting/marge-chantiers/export?${qs.toString()}`, 'marge_chantiers.csv');
}

export function fetchStock() {
  return apiFetch<RapportStock>('/api/reporting/stock');
}
export function exportStock() {
  return apiDownload('/api/reporting/stock/export', 'etat_stock.csv');
}

export function fetchImpayes() {
  return apiFetch<RapportImpayes>('/api/reporting/impayes');
}
export function exportImpayes() {
  return apiDownload('/api/reporting/impayes/export', 'impayes_clients.csv');
}
