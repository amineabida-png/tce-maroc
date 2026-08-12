import { apiFetch, apiOpenBlob, apiUpload } from '@/lib/api';
import type { DocumentMetadonnees, TypeEntiteDocument } from './types';

export function fetchDocuments(entiteType: TypeEntiteDocument, entiteId: string) {
  const qs = new URLSearchParams({ entiteType, entiteId });
  return apiFetch<DocumentMetadonnees[]>(`/api/documents?${qs.toString()}`);
}

export function uploadDocument(entiteType: TypeEntiteDocument, entiteId: string, fichier: File) {
  const formData = new FormData();
  formData.append('fichier', fichier);
  formData.append('entiteType', entiteType);
  formData.append('entiteId', entiteId);
  return apiUpload<DocumentMetadonnees>('/api/documents', formData);
}

export function ouvrirDocument(id: string) {
  return apiOpenBlob(`/api/documents/${id}/telecharger`);
}

export function deleteDocument(id: string) {
  return apiFetch<void>(`/api/documents/${id}`, { method: 'DELETE' });
}
