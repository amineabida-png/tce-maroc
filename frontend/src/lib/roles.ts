// Miroir de backend/src/lib/roles.ts — ADMIN/DIRECTEUR peuvent modifier ou
// supprimer un document au-delà des statuts habituellement modifiables
// (le serveur applique la même règle et reste la source de vérité).
export function isRoleManager(role: string | undefined): boolean {
  return role === 'ADMIN' || role === 'DIRECTEUR';
}
