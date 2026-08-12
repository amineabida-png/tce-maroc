import { apiFetch } from '@/lib/api';
import type { Paginated } from '@/lib/types';
import type {
  CompteTresorerie,
  Echeancier,
  JournalEntry,
  ModePaiementTresorerie,
  MouvementTresorerie,
  SensMouvement,
  StatutMouvement,
  TypeCompte,
} from './types';

export interface CompteFormValues {
  nom: string;
  type: TypeCompte;
  banque: string;
  rib: string;
  soldeInitial: string;
}

function compteToPayload(values: CompteFormValues) {
  return { ...values, soldeInitial: values.soldeInitial ? Number(values.soldeInitial) : 0 };
}

export function fetchComptes(params: { q?: string; page?: number; includeInactifs?: boolean }) {
  const qs = new URLSearchParams();
  if (params.q) qs.set('q', params.q);
  if (params.page) qs.set('page', String(params.page));
  if (params.includeInactifs) qs.set('includeInactifs', 'true');
  qs.set('pageSize', '100');
  return apiFetch<Paginated<CompteTresorerie>>(`/api/comptes-tresorerie?${qs.toString()}`);
}
export function createCompte(values: CompteFormValues) {
  return apiFetch<CompteTresorerie>('/api/comptes-tresorerie', { method: 'POST', body: JSON.stringify(compteToPayload(values)) });
}
export function updateCompte(id: string, values: CompteFormValues) {
  return apiFetch<CompteTresorerie>(`/api/comptes-tresorerie/${id}`, { method: 'PUT', body: JSON.stringify(compteToPayload(values)) });
}
export function deactivateCompte(id: string) {
  return apiFetch<CompteTresorerie>(`/api/comptes-tresorerie/${id}/desactiver`, { method: 'POST' });
}
export function reactivateCompte(id: string) {
  return apiFetch<CompteTresorerie>(`/api/comptes-tresorerie/${id}/reactiver`, { method: 'POST' });
}

export interface MouvementFormValues {
  compteId: string;
  sens: SensMouvement;
  statut: StatutMouvement;
  montant: string;
  date: string;
  modePaiement: ModePaiementTresorerie;
  reference: string;
  description: string;
  chantierId: string;
  fournisseurId: string;
  sousTraitantId: string;
}

function mouvementToPayload(values: MouvementFormValues) {
  return { ...values, montant: Number(values.montant) };
}

export function fetchMouvements(params: {
  q?: string;
  page?: number;
  compteId?: string;
  sens?: string;
  statut?: string;
  debut?: string;
  fin?: string;
}) {
  const qs = new URLSearchParams();
  if (params.q) qs.set('q', params.q);
  if (params.page) qs.set('page', String(params.page));
  if (params.compteId) qs.set('compteId', params.compteId);
  if (params.sens) qs.set('sens', params.sens);
  if (params.statut) qs.set('statut', params.statut);
  if (params.debut) qs.set('debut', params.debut);
  if (params.fin) qs.set('fin', params.fin);
  return apiFetch<Paginated<MouvementTresorerie>>(`/api/mouvements-tresorerie?${qs.toString()}`);
}
export function createMouvement(values: MouvementFormValues) {
  return apiFetch<MouvementTresorerie>('/api/mouvements-tresorerie', { method: 'POST', body: JSON.stringify(mouvementToPayload(values)) });
}
export function updateMouvement(id: string, values: MouvementFormValues) {
  return apiFetch<MouvementTresorerie>(`/api/mouvements-tresorerie/${id}`, { method: 'PUT', body: JSON.stringify(mouvementToPayload(values)) });
}
export function deleteMouvement(id: string) {
  return apiFetch<void>(`/api/mouvements-tresorerie/${id}`, { method: 'DELETE' });
}
export function rapprocherMouvement(id: string, rapproche: boolean) {
  return apiFetch<MouvementTresorerie>(`/api/mouvements-tresorerie/${id}/rapprocher`, {
    method: 'POST',
    body: JSON.stringify({ rapproche }),
  });
}

export function fetchJournal(params: { compteId?: string; debut?: string; fin?: string }) {
  const qs = new URLSearchParams();
  if (params.compteId) qs.set('compteId', params.compteId);
  if (params.debut) qs.set('debut', params.debut);
  if (params.fin) qs.set('fin', params.fin);
  return apiFetch<JournalEntry[]>(`/api/mouvements-tresorerie/journal?${qs.toString()}`);
}

export function fetchEcheancier() {
  return apiFetch<Echeancier>('/api/mouvements-tresorerie/echeancier');
}
