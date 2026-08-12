import { apiFetch } from '@/lib/api';
import type { Paginated } from '@/lib/types';
import type { Facture, FactureSummary } from './types';

export interface LigneContent {
  designation: string;
  unite: string;
  quantite: string;
  prixUnitaire: string;
}
export interface FactureContent {
  type: string;
  clientId: string;
  chantierId: string;
  dateEcheance: string;
  tauxTva: string;
  tauxRetenueGarantie: string;
  lignes: LigneContent[];
}

function toPayload(content: FactureContent) {
  return {
    type: content.type || undefined,
    clientId: content.clientId,
    chantierId: content.chantierId || undefined,
    dateEcheance: content.dateEcheance || undefined,
    tauxTva: content.tauxTva ? Number(content.tauxTva) : undefined,
    tauxRetenueGarantie: content.tauxRetenueGarantie ? Number(content.tauxRetenueGarantie) : undefined,
    lignes: content.lignes.map((l) => ({ ...l, quantite: Number(l.quantite), prixUnitaire: Number(l.prixUnitaire) })),
  };
}

export interface PaiementFormValues {
  montant: string;
  date: string;
  mode: string;
  reference: string;
}

export function fetchFacturesList(params: { q?: string; page?: number; statut?: string; impayees?: boolean }) {
  const qs = new URLSearchParams();
  if (params.q) qs.set('q', params.q);
  if (params.page) qs.set('page', String(params.page));
  if (params.statut) qs.set('statut', params.statut);
  if (params.impayees) qs.set('impayees', 'true');
  return apiFetch<Paginated<FactureSummary>>(`/api/factures?${qs.toString()}`);
}

export function fetchFacture(id: string) {
  return apiFetch<Facture>(`/api/factures/${id}`);
}

export function createFacture(content: FactureContent) {
  return apiFetch<Facture>('/api/factures', { method: 'POST', body: JSON.stringify(toPayload(content)) });
}

export function updateFacture(id: string, content: FactureContent) {
  return apiFetch<Facture>(`/api/factures/${id}`, { method: 'PUT', body: JSON.stringify(toPayload(content)) });
}

export function deleteFacture(id: string) {
  return apiFetch<void>(`/api/factures/${id}`, { method: 'DELETE' });
}

export function envoyerFacture(id: string) {
  return apiFetch<Facture>(`/api/factures/${id}/envoyer`, { method: 'POST' });
}

export function annulerFacture(id: string) {
  return apiFetch<Facture>(`/api/factures/${id}/annuler`, { method: 'POST' });
}

export function addPaiement(id: string, values: PaiementFormValues) {
  return apiFetch<Facture>(`/api/factures/${id}/paiements`, {
    method: 'POST',
    body: JSON.stringify({ ...values, montant: Number(values.montant) }),
  });
}

export function deletePaiement(id: string, paiementId: string) {
  return apiFetch<Facture>(`/api/factures/${id}/paiements/${paiementId}`, { method: 'DELETE' });
}
