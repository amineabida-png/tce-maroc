import { formatMAD } from '@/lib/currency';
import type { LigneCAMois } from './types';

const MOIS_COURTS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

function last6MonthsPeriodes(): string[] {
  const periodes: string[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    periodes.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return periodes;
}

// Mini graphique en barres sans dépendance externe — 6 derniers mois de CA
// TTC, avec les mois sans activité complétés à zéro pour un axe continu.
export function CAChart({ lignes }: { lignes: LigneCAMois[] }) {
  const parPeriode = new Map(lignes.map((l) => [l.periode, l.montantTTC]));
  const periodes = last6MonthsPeriodes();
  const valeurs = periodes.map((p) => parPeriode.get(p) ?? 0);
  const max = Math.max(...valeurs, 1);

  return (
    <div className="flex h-40 items-end gap-3">
      {periodes.map((periode, i) => {
        const valeur = valeurs[i] as number;
        const [year, month] = periode.split('-');
        const label = `${MOIS_COURTS[Number(month) - 1]}`;
        const hauteurPct = Math.max(2, Math.round((valeur / max) * 100));
        return (
          <div key={periode} className="flex flex-1 flex-col items-center gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">{valeur > 0 ? formatMAD(valeur) : ''}</span>
            <div className="flex h-28 w-full items-end">
              <div
                className="w-full rounded-t-sm bg-primary transition-all"
                style={{ height: `${hauteurPct}%` }}
                title={`${label} ${year} — ${formatMAD(valeur)}`}
              />
            </div>
            <span className="text-xs text-muted-foreground">
              {label} {year.slice(2)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
