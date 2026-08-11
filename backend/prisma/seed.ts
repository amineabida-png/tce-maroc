// Amorce la base : paramètres société par défaut + numérotations + premier
// compte admin. Idempotent (peut être relancé sans dupliquer). Le mot de
// passe admin n'est jamais codé en dur dans le dépôt : fourni via
// ADMIN_PASSWORD, ou généré aléatoirement et affiché une seule fois dans
// les logs si absent.
import { randomBytes } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/lib/password';

const prisma = new PrismaClient();

const DEFAULT_NUMEROTATIONS = [
  { typeDocument: 'DEVIS', prefixe: 'DEV' },
  { typeDocument: 'BON_COMMANDE', prefixe: 'BC' },
  { typeDocument: 'FACTURE', prefixe: 'FACT' },
  { typeDocument: 'SITUATION', prefixe: 'SIT' },
];

async function main() {
  let societe = await prisma.societe.findFirst();
  if (!societe) {
    societe = await prisma.societe.create({
      data: {
        nom: 'Ma Société TCE',
        ville: 'Casablanca',
        tauxTvaDefaut: 20,
        tauxRetenueGarantie: 10,
        tauxRetenueSource: 0,
      },
    });
    console.log('✓ Société créée (à compléter dans les paramètres) :', societe.id);
  } else {
    console.log('· Société déjà initialisée, inchangée.');
  }

  const currentYear = new Date().getFullYear();
  for (const num of DEFAULT_NUMEROTATIONS) {
    await prisma.numerotation.upsert({
      where: { societeId_typeDocument: { societeId: societe.id, typeDocument: num.typeDocument } },
      update: {},
      create: {
        societeId: societe.id,
        typeDocument: num.typeDocument,
        prefixe: num.prefixe,
        anneeCourante: currentYear,
        dernierNumero: 0,
      },
    });
  }
  console.log('✓ Numérotations par défaut vérifiées (DEVIS, BON_COMMANDE, FACTURE, SITUATION).');

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@tce-maroc.local';
  const existingAdmin = await prisma.utilisateur.findUnique({ where: { email: adminEmail } });
  if (existingAdmin) {
    console.log(`· Compte admin (${adminEmail}) déjà présent, inchangé.`);
  } else {
    const password = process.env.ADMIN_PASSWORD || randomBytes(9).toString('base64url');
    const hash = await hashPassword(password);
    await prisma.utilisateur.create({
      data: {
        email: adminEmail,
        motDePasse: hash,
        nom: 'Administrateur',
        prenom: 'Compte',
        role: 'ADMIN',
      },
    });
    console.log('✓ Compte admin créé.');
    console.log(`  Email    : ${adminEmail}`);
    if (!process.env.ADMIN_PASSWORD) {
      console.log(`  Mot de passe (généré, à noter et changer ensuite) : ${password}`);
    } else {
      console.log('  Mot de passe : celui fourni via ADMIN_PASSWORD.');
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
