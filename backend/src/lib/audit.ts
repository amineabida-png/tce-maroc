import { prisma } from '../db/client';

interface AuditEntry {
  utilisateurId?: string | null;
  action: string;
  entite?: string;
  entiteId?: string;
  metadonnees?: Record<string, unknown>;
}

// Ne doit jamais faire échouer l'action métier qu'il accompagne : une
// panne du journal d'audit ne doit pas empêcher un utilisateur de créer
// un devis.
export async function logAudit(entry: AuditEntry): Promise<void> {
  try {
    await prisma.journalAudit.create({
      data: {
        utilisateurId: entry.utilisateurId ?? null,
        action: entry.action,
        entite: entry.entite,
        entiteId: entry.entiteId,
        metadonnees: entry.metadonnees as never,
      },
    });
  } catch (err) {
    console.error('Échec écriture journal audit:', err);
  }
}
