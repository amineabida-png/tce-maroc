import { apiDownload, apiFetch } from '@/lib/api';
import type { Paginated } from '@/lib/types';
import type { CoutMainDoeuvre, Employe, Pointage, StatutPointage, TypeContrat } from './types';

export interface EmployeFormValues {
  nom: string;
  prenom: string;
  cin: string;
  cnss: string;
  poste: string;
  typeContrat: TypeContrat;
  dateEmbauche: string;
  tauxHoraire: string;
  telephone: string;
  email: string;
  adresse: string;
  notes: string;
}

function toPayload(values: EmployeFormValues) {
  return {
    ...values,
    dateEmbauche: values.dateEmbauche || null,
    tauxHoraire: values.tauxHoraire ? Number(values.tauxHoraire) : null,
  };
}

export function fetchEmployes(params: { q?: string; page?: number; includeInactifs?: boolean }) {
  const qs = new URLSearchParams();
  if (params.q) qs.set('q', params.q);
  if (params.page) qs.set('page', String(params.page));
  if (params.includeInactifs) qs.set('includeInactifs', 'true');
  return apiFetch<Paginated<Employe>>(`/api/employes?${qs.toString()}`);
}

export function createEmploye(values: EmployeFormValues) {
  return apiFetch<Employe>('/api/employes', { method: 'POST', body: JSON.stringify(toPayload(values)) });
}
export function updateEmploye(id: string, values: EmployeFormValues) {
  return apiFetch<Employe>(`/api/employes/${id}`, { method: 'PUT', body: JSON.stringify(toPayload(values)) });
}
export function deactivateEmploye(id: string) {
  return apiFetch<Employe>(`/api/employes/${id}/desactiver`, { method: 'POST' });
}
export function reactivateEmploye(id: string) {
  return apiFetch<Employe>(`/api/employes/${id}/reactiver`, { method: 'POST' });
}
export function exportPaie(debut: string, fin: string) {
  return apiDownload(`/api/employes/export-paie?debut=${debut}&fin=${fin}`, `paie_${debut}_${fin}.csv`);
}

export interface UpsertPointageValues {
  employeId: string;
  chantierId: string;
  date: string;
  statut: StatutPointage;
  nombreHeures: string;
  notes: string;
}

export function fetchPointages(params: { employeId?: string; chantierId?: string; debut?: string; fin?: string; page?: number }) {
  const qs = new URLSearchParams();
  if (params.employeId) qs.set('employeId', params.employeId);
  if (params.chantierId) qs.set('chantierId', params.chantierId);
  if (params.debut) qs.set('debut', params.debut);
  if (params.fin) qs.set('fin', params.fin);
  qs.set('pageSize', '200');
  if (params.page) qs.set('page', String(params.page));
  return apiFetch<Paginated<Pointage>>(`/api/pointages?${qs.toString()}`);
}

export function upsertPointage(values: UpsertPointageValues) {
  return apiFetch<Pointage>('/api/pointages', {
    method: 'POST',
    body: JSON.stringify({
      ...values,
      chantierId: values.chantierId || null,
      nombreHeures: values.nombreHeures ? Number(values.nombreHeures) : null,
    }),
  });
}
export function deletePointage(id: string) {
  return apiFetch<void>(`/api/pointages/${id}`, { method: 'DELETE' });
}
export function fetchCoutMainDoeuvre(chantierId: string, debut?: string, fin?: string) {
  const qs = new URLSearchParams({ chantierId });
  if (debut) qs.set('debut', debut);
  if (fin) qs.set('fin', fin);
  return apiFetch<CoutMainDoeuvre>(`/api/pointages/cout-main-doeuvre?${qs.toString()}`);
}
