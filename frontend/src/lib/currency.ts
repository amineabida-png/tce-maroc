// Format monétaire marocain : "1 234,56 DH" (espace insécable comme
// séparateur de milliers, virgule décimale, suffixe DH).
export function formatMAD(value: number | string): string {
  const n = typeof value === 'string' ? parseFloat(value) : value;
  if (Number.isNaN(n)) return '—';
  const formatted = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
  return `${formatted} DH`;
}
