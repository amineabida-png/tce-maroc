// ADMIN/DIRECTEUR peuvent modifier ou supprimer un document au-delà des
// statuts habituellement modifiables (ex. après envoi) — les autres rôles
// restent soumis aux règles de statut habituelles pour éviter qu'une
// correction courante n'altère par erreur une pièce déjà engagée.
export function isRoleManager(role: string | undefined): boolean {
  return role === 'ADMIN' || role === 'DIRECTEUR';
}
