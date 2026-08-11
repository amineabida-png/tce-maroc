// Génère le prochain numéro de pièce (devis, facture, bon de commande...)
// de façon atomique au niveau base de données (UPSERT + incrément en une
// seule requête SQL), pour garantir l'absence de doublon même si deux
// documents sont créés au même instant par deux utilisateurs différents —
// un simple "lire puis écrire" côté application ne suffirait pas à éviter
// une collision sous concurrence.
import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '../db/client';

export async function nextNumero(
  societeId: string,
  typeDocument: string,
  prefixe: string
): Promise<string> {
  const currentYear = new Date().getFullYear();
  const id = randomUUID();

  const rows = await prisma.$queryRaw<{ dernierNumero: number }[]>(Prisma.sql`
    INSERT INTO tce_maroc."Numerotation" (id, "societeId", "typeDocument", prefixe, "anneeCourante", "dernierNumero", "resetAnnuel")
    VALUES (${id}, ${societeId}, ${typeDocument}, ${prefixe}, ${currentYear}, 1, true)
    ON CONFLICT ("societeId", "typeDocument") DO UPDATE SET
      "dernierNumero" = CASE
        WHEN tce_maroc."Numerotation"."resetAnnuel" AND tce_maroc."Numerotation"."anneeCourante" <> ${currentYear}
        THEN 1
        ELSE tce_maroc."Numerotation"."dernierNumero" + 1
      END,
      "anneeCourante" = ${currentYear}
    RETURNING "dernierNumero"
  `);

  const dernierNumero = rows[0]?.dernierNumero ?? 1;
  return `${prefixe}-${currentYear}-${String(dernierNumero).padStart(4, '0')}`;
}
