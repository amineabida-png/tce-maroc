// Générateur CSV minimal (pas de dépendance externe) — échappement RFC 4180
// standard : un champ contenant une virgule, un guillemet ou un retour à la
// ligne est entouré de guillemets, les guillemets internes sont doublés.
function escapeCsvField(value: unknown): string {
  const s = value === null || value === undefined ? '' : String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export interface CsvColumn<T> {
  key: keyof T;
  label: string;
}

export function toCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const header = columns.map((c) => escapeCsvField(c.label)).join(',');
  const lines = rows.map((row) => columns.map((c) => escapeCsvField(row[c.key])).join(','));
  // BOM UTF-8 : Excel (très utilisé pour la paie) affiche mal les accents sans lui.
  return '﻿' + [header, ...lines].join('\r\n');
}
