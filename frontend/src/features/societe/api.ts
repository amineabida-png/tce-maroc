import { apiFetch } from '@/lib/api';
import type { Numerotation, Societe } from './types';

export interface SocieteFormValues {
  nom: string;
  formeJuridique: string;
  adresse: string;
  ville: string;
  telephone: string;
  email: string;
  logo: string;
  cachet: string;
  ice: string;
  rc: string;
  identifiantFiscal: string;
  patente: string;
  cnss: string;
  rib: string;
  tauxTvaDefaut: string;
  tauxRetenueGarantie: string;
  tauxRetenueSource: string;
}

export function fetchSociete() {
  return apiFetch<Societe>('/api/societe');
}

export function updateSociete(values: SocieteFormValues) {
  return apiFetch<Societe>('/api/societe', {
    method: 'PUT',
    body: JSON.stringify({
      ...values,
      tauxTvaDefaut: Number(values.tauxTvaDefaut),
      tauxRetenueGarantie: Number(values.tauxRetenueGarantie),
      tauxRetenueSource: Number(values.tauxRetenueSource),
    }),
  });
}

export function upsertNumerotation(typeDocument: string, prefixe: string, resetAnnuel: boolean, prochainNumero?: number) {
  return apiFetch<Numerotation>('/api/societe/numerotations', {
    method: 'PUT',
    body: JSON.stringify({ typeDocument, prefixe, resetAnnuel, prochainNumero }),
  });
}
