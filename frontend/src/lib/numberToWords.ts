// Conversion nombre → lettres (français) pour les montants imprimés
// ("Arrêté le présent document à la somme de : ..."). Implémentation maison
// (pas de dépendance) car le besoin est isolé et les règles orthographiques
// françaises sont figées une fois pour toutes ici — notamment : "vingt" et
// "cent" ne prennent la marque du pluriel que lorsqu'ils multiplient un
// nombre ET ne sont pas eux-mêmes suivis d'un autre nombre ("quatre-vingts"
// mais "quatre-vingt mille", "deux cents" mais "deux cent mille").
const UNITES = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
const DIX_A_DIXNEUF = ['dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
const DIZAINES: Record<number, string> = { 2: 'vingt', 3: 'trente', 4: 'quarante', 5: 'cinquante', 6: 'soixante' };

// `terminal` : ce groupe est-il le dernier de tout le nombre (rien après,
// pas même "mille"/"million"/"milliard") ? Conditionne le -s de "vingt".
function deuxChiffresEnLettres(n: number, terminal: boolean): string {
  if (n === 0) return '';
  if (n < 10) return UNITES[n];
  if (n < 20) return DIX_A_DIXNEUF[n - 10];
  if (n < 70) {
    const d = Math.floor(n / 10);
    const u = n % 10;
    const base = DIZAINES[d];
    if (u === 0) return base;
    if (u === 1) return `${base} et un`;
    return `${base}-${UNITES[u]}`;
  }
  if (n < 80) {
    const reste = n - 60; // 10..19
    if (reste === 11) return 'soixante et onze';
    return `soixante-${DIX_A_DIXNEUF[reste - 10]}`;
  }
  const reste = n - 80; // 0..19
  if (reste === 0) return terminal ? 'quatre-vingts' : 'quatre-vingt';
  if (reste < 10) return `quatre-vingt-${UNITES[reste]}`;
  return `quatre-vingt-${DIX_A_DIXNEUF[reste - 10]}`;
}

function troisChiffresEnLettres(n: number, terminal: boolean): string {
  if (n < 100) return deuxChiffresEnLettres(n, terminal);
  const centaines = Math.floor(n / 100);
  const reste = n % 100;
  if (reste === 0) {
    const cent = centaines > 1 ? (terminal ? 'cents' : 'cent') : 'cent';
    return centaines === 1 ? cent : `${UNITES[centaines]} ${cent}`;
  }
  const cent = centaines === 1 ? 'cent' : `${UNITES[centaines]} cent`;
  return `${cent} ${deuxChiffresEnLettres(reste, terminal)}`;
}

function nombreEnLettres(n: number): string {
  if (n === 0) return 'zéro';
  const milliards = Math.floor(n / 1_000_000_000);
  const millions = Math.floor((n % 1_000_000_000) / 1_000_000);
  const milliers = Math.floor((n % 1_000_000) / 1000);
  const unites = n % 1000;

  const parts: string[] = [];
  if (milliards > 0) parts.push(`${milliards === 1 ? 'un' : troisChiffresEnLettres(milliards, false)} milliard${milliards > 1 ? 's' : ''}`);
  if (millions > 0) parts.push(`${millions === 1 ? 'un' : troisChiffresEnLettres(millions, false)} million${millions > 1 ? 's' : ''}`);
  if (milliers > 0) parts.push(milliers === 1 ? 'mille' : `${troisChiffresEnLettres(milliers, false)} mille`);
  if (unites > 0 || parts.length === 0) parts.push(troisChiffresEnLettres(unites, true));
  return parts.join(' ');
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// "Quatre-vingt mille quarante dirhams et cinquante centimes"
export function montantEnLettres(montant: number | string): string {
  const n = typeof montant === 'string' ? parseFloat(montant) : montant;
  const totalCentimes = Math.round(Math.abs(Number.isFinite(n) ? n : 0) * 100);
  const dirhams = Math.floor(totalCentimes / 100);
  const centimes = totalCentimes % 100;

  let phrase = `${capitalize(nombreEnLettres(dirhams))} dirham${dirhams > 1 ? 's' : ''}`;
  if (centimes > 0) {
    phrase += ` et ${nombreEnLettres(centimes)} centime${centimes > 1 ? 's' : ''}`;
  }
  return phrase;
}
