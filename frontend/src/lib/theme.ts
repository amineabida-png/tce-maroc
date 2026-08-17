// Applique la charte de couleurs personnelle de l'utilisateur (stockée en
// hex #RRGGBB) aux variables CSS consommées via hsl(var(--primary)) etc.
// (voir tailwind.config.ts) — en écrasant --primary et --brand au niveau du
// root, avec une couleur de texte lisible calculée automatiquement.

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) return { h: 0, s: 0, l: Math.round(l * 100) };

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  switch (max) {
    case r:
      h = (g - b) / d + (g < b ? 6 : 0);
      break;
    case g:
      h = (b - r) / d + 2;
      break;
    default:
      h = (r - g) / d + 4;
  }
  h *= 60;

  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslTriplet(hex: string): string {
  const { h, s, l } = hexToHsl(hex);
  return `${h} ${s}% ${l}%`;
}

// Texte blanc sur les couleurs sombres/saturées, texte foncé sur les
// couleurs claires — mêmes seuils que le foreground par défaut de l'app.
function idealForeground(hex: string): string {
  const { l } = hexToHsl(hex);
  return l > 60 ? '222 25% 15%' : '0 0% 100%';
}

export function applyUserTheme(couleurPrimaire: string | null | undefined, couleurAccent: string | null | undefined): void {
  const root = document.documentElement.style;
  if (couleurPrimaire) {
    const triplet = hslTriplet(couleurPrimaire);
    root.setProperty('--primary', triplet);
    root.setProperty('--ring', triplet);
    root.setProperty('--primary-foreground', idealForeground(couleurPrimaire));
  } else {
    root.removeProperty('--primary');
    root.removeProperty('--ring');
    root.removeProperty('--primary-foreground');
  }
  if (couleurAccent) {
    root.setProperty('--brand', hslTriplet(couleurAccent));
    root.setProperty('--brand-foreground', idealForeground(couleurAccent));
  } else {
    root.removeProperty('--brand');
    root.removeProperty('--brand-foreground');
  }
}
