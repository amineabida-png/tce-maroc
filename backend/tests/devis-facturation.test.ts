import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { prisma } from '../src/db/client';
import { hashPassword } from '../src/lib/password';

const app = createApp();

const commercialEmail = `test-commercial-devis-${randomUUID()}@tce-maroc.local`;
const comptableEmail = `test-comptable-devis-${randomUUID()}@tce-maroc.local`;
const magasinierEmail = `test-magasinier-devis-${randomUUID()}@tce-maroc.local`;
const password = 'TestPassword123';
let commercialId: string;
let comptableId: string;
let magasinierId: string;
let commercialToken: string;
let comptableToken: string;
let magasinierToken: string;

let testClientId: string;
const createdDevisIds: string[] = [];
const createdCommandeIds: string[] = [];
const createdFactureIds: string[] = [];
const createdOuvrageIds: string[] = [];

beforeAll(async () => {
  const hash = await hashPassword(password);
  const commercial = await prisma.utilisateur.create({
    data: { email: commercialEmail, motDePasse: hash, nom: 'Test', prenom: 'Commercial', role: 'COMMERCIAL' },
  });
  commercialId = commercial.id;
  const comptable = await prisma.utilisateur.create({
    data: { email: comptableEmail, motDePasse: hash, nom: 'Test', prenom: 'Comptable', role: 'COMPTABLE' },
  });
  comptableId = comptable.id;
  const magasinier = await prisma.utilisateur.create({
    data: { email: magasinierEmail, motDePasse: hash, nom: 'Test', prenom: 'Magasinier', role: 'MAGASINIER' },
  });
  magasinierId = magasinier.id;

  commercialToken = (await request(app).post('/api/auth/login').send({ email: commercialEmail, motDePasse: password })).body
    .accessToken;
  comptableToken = (await request(app).post('/api/auth/login').send({ email: comptableEmail, motDePasse: password })).body
    .accessToken;
  magasinierToken = (await request(app).post('/api/auth/login').send({ email: magasinierEmail, motDePasse: password })).body
    .accessToken;

  const client = await prisma.client.create({ data: { type: 'ENTREPRISE', nom: 'Client Devis Intégration' } });
  testClientId = client.id;
});

afterAll(async () => {
  for (const id of createdFactureIds) await prisma.paiement.deleteMany({ where: { factureId: id } });
  await prisma.facture.deleteMany({ where: { id: { in: createdFactureIds } } });
  await prisma.commande.deleteMany({ where: { id: { in: createdCommandeIds } } });
  await prisma.devis.deleteMany({ where: { id: { in: createdDevisIds } } });
  await prisma.ouvrage.deleteMany({ where: { id: { in: createdOuvrageIds } } });
  await prisma.client.delete({ where: { id: testClientId } });
  await prisma.refreshToken.deleteMany({ where: { utilisateurId: { in: [commercialId, comptableId, magasinierId] } } });
  await prisma.utilisateur.deleteMany({ where: { id: { in: [commercialId, comptableId, magasinierId] } } });
  await prisma.$disconnect();
});

describe('Ouvrages (BPU) — RBAC', () => {
  it("un MAGASINIER ne peut pas créer d'ouvrage (réservé ADMIN/DIRECTEUR)", async () => {
    const res = await request(app)
      .post('/api/ouvrages')
      .set('Authorization', `Bearer ${magasinierToken}`)
      .send({ corpsDetat: 'Électricité', designation: 'Prise', unite: 'u', prixUnitaireDefaut: 50 });
    expect(res.status).toBe(403);
  });
});

describe('Devis — calcul des totaux et lots', () => {
  it('calcule correctement HT/TVA/TTC sur plusieurs lots et lignes sans lot', async () => {
    const res = await request(app)
      .post('/api/devis')
      .set('Authorization', `Bearer ${commercialToken}`)
      .send({
        clientId: testClientId,
        tauxTva: 20,
        lots: [
          {
            nom: 'Gros œuvre',
            lignes: [
              { designation: 'Fondations', unite: 'm3', quantite: 10, prixUnitaire: 800 },
              { designation: 'Élévation', unite: 'm2', quantite: 50, prixUnitaire: 300 },
            ],
          },
          { nom: 'Électricité', lignes: [{ designation: 'Câblage', unite: 'forfait', quantite: 1, prixUnitaire: 15000 }] },
        ],
        lignesSansLot: [{ designation: 'Divers', unite: 'forfait', quantite: 1, prixUnitaire: 2000 }],
      });
    expect(res.status).toBe(201);
    expect(res.body.numero).toMatch(/^DEV-\d{4}-\d{4}$/);
    expect(res.body.totaux).toEqual({ montantHT: 40000, montantTVA: 8000, montantTTC: 48000, montantRetenueGarantie: 0, montantNetAPayer: 48000 });
    createdDevisIds.push(res.body.id);
  });

  it('rejette une ligne avec une quantité négative ou nulle', async () => {
    const res = await request(app)
      .post('/api/devis')
      .set('Authorization', `Bearer ${commercialToken}`)
      .send({ clientId: testClientId, lots: [], lignesSansLot: [{ designation: 'X', unite: 'u', quantite: -1, prixUnitaire: 10 }] });
    expect(res.status).toBe(400);
  });
});

describe('Chaîne de conversion Devis → Commande → Facture', () => {
  it('bloque la conversion tant que le devis n’est pas ACCEPTE, puis convertit après acceptation', async () => {
    const devis = await request(app)
      .post('/api/devis')
      .set('Authorization', `Bearer ${commercialToken}`)
      .send({ clientId: testClientId, tauxTva: 20, lignesSansLot: [{ designation: 'Prestation', unite: 'forfait', quantite: 1, prixUnitaire: 1000 }] });
    createdDevisIds.push(devis.body.id);
    const devisId = devis.body.id;

    const blocked = await request(app).post(`/api/devis/${devisId}/convertir-commande`).set('Authorization', `Bearer ${commercialToken}`);
    expect(blocked.status).toBe(409);

    const invalidTransition = await request(app)
      .post(`/api/devis/${devisId}/statut`)
      .set('Authorization', `Bearer ${commercialToken}`)
      .send({ statut: 'ACCEPTE' });
    expect(invalidTransition.status).toBe(409); // BROUILLON -> ACCEPTE directement interdit

    await request(app).post(`/api/devis/${devisId}/statut`).set('Authorization', `Bearer ${commercialToken}`).send({ statut: 'ENVOYE' });
    await request(app).post(`/api/devis/${devisId}/statut`).set('Authorization', `Bearer ${commercialToken}`).send({ statut: 'ACCEPTE' });

    const lockedEdit = await request(app)
      .put(`/api/devis/${devisId}`)
      .set('Authorization', `Bearer ${commercialToken}`)
      .send({ clientId: testClientId, lots: [], lignesSansLot: [] });
    expect(lockedEdit.status).toBe(409); // devis accepté = verrouillé

    const commande = await request(app).post(`/api/devis/${devisId}/convertir-commande`).set('Authorization', `Bearer ${commercialToken}`);
    expect(commande.status).toBe(201);
    expect(commande.body.numero).toMatch(/^BC-\d{4}-\d{4}$/);
    expect(commande.body.totaux.montantHT).toBe(1000);
    createdCommandeIds.push(commande.body.id);
    const commandeId = commande.body.id;

    const devisAfter = await request(app).get(`/api/devis/${devisId}`).set('Authorization', `Bearer ${commercialToken}`);
    expect(devisAfter.body.statut).toBe('CONVERTI');

    const doubleConvert = await request(app).post(`/api/devis/${devisId}/convertir-commande`).set('Authorization', `Bearer ${commercialToken}`);
    expect(doubleConvert.status).toBe(409);

    const factureTooEarly = await request(app)
      .post(`/api/commandes/${commandeId}/convertir-facture`)
      .set('Authorization', `Bearer ${comptableToken}`);
    expect(factureTooEarly.status).toBe(409);

    await request(app)
      .post(`/api/commandes/${commandeId}/statut`)
      .set('Authorization', `Bearer ${commercialToken}`)
      .send({ statut: 'CONFIRMEE' });

    const facture = await request(app).post(`/api/commandes/${commandeId}/convertir-facture`).set('Authorization', `Bearer ${comptableToken}`);
    expect(facture.status).toBe(201);
    expect(facture.body.numero).toMatch(/^FACT-\d{4}-\d{4}$/);
    expect(facture.body.tauxRetenueGarantie).toBe('10'); // valeur par défaut société
    expect(facture.body.totaux.montantRetenueGarantie).toBe(120); // 1000 HT * 1.2 = 1200 TTC, 10% = 120
    createdFactureIds.push(facture.body.id);

    const commandeAfter = await request(app).get(`/api/commandes/${commandeId}`).set('Authorization', `Bearer ${commercialToken}`);
    expect(commandeAfter.body.statut).toBe('FACTUREE');
  });
});

describe('Facture — paiements et impayés', () => {
  let factureId: string;

  it('crée une facture, l’envoie, et suit les paiements partiels/complets', async () => {
    const facture = await request(app)
      .post('/api/factures')
      .set('Authorization', `Bearer ${comptableToken}`)
      .send({
        clientId: testClientId,
        tauxTva: 20,
        tauxRetenueGarantie: 0,
        lignes: [{ designation: 'Test paiement', unite: 'forfait', quantite: 1, prixUnitaire: 1000 }],
      });
    expect(facture.status).toBe(201);
    createdFactureIds.push(facture.body.id);
    factureId = facture.body.id;
    expect(facture.body.totaux.montantNetAPayer).toBe(1200);

    const paiementBeforeEnvoi = await request(app)
      .post(`/api/factures/${factureId}/paiements`)
      .set('Authorization', `Bearer ${comptableToken}`)
      .send({ montant: 100, date: '2026-01-01' });
    expect(paiementBeforeEnvoi.status).toBe(409);

    await request(app).post(`/api/factures/${factureId}/envoyer`).set('Authorization', `Bearer ${comptableToken}`);

    const impayees = await request(app).get('/api/factures?impayees=true').set('Authorization', `Bearer ${comptableToken}`);
    expect(impayees.body.items.some((f: { id: string }) => f.id === factureId)).toBe(true);

    const partiel = await request(app)
      .post(`/api/factures/${factureId}/paiements`)
      .set('Authorization', `Bearer ${comptableToken}`)
      .send({ montant: 500, date: '2026-01-05' });
    expect(partiel.body.statut).toBe('PARTIELLEMENT_PAYEE');
    expect(partiel.body.montantRestantDu).toBe(700);

    const complet = await request(app)
      .post(`/api/factures/${factureId}/paiements`)
      .set('Authorization', `Bearer ${comptableToken}`)
      .send({ montant: 700, date: '2026-01-10' });
    expect(complet.body.statut).toBe('PAYEE');
    expect(complet.body.montantRestantDu).toBe(0);

    const impayeesAfter = await request(app).get('/api/factures?impayees=true').set('Authorization', `Bearer ${comptableToken}`);
    expect(impayeesAfter.body.items.some((f: { id: string }) => f.id === factureId)).toBe(false);
  });

  it("un COMMERCIAL ne peut pas créer de facture (403 — RBAC)", async () => {
    const res = await request(app)
      .post('/api/factures')
      .set('Authorization', `Bearer ${commercialToken}`)
      .send({ clientId: testClientId, lignes: [] });
    expect(res.status).toBe(403);
  });
});
