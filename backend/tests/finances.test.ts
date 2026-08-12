import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { prisma } from '../src/db/client';
import { hashPassword } from '../src/lib/password';

const app = createApp();

const comptableEmail = `test-comptable-fin-${randomUUID()}@tce-maroc.local`;
const commercialEmail = `test-commercial-fin-${randomUUID()}@tce-maroc.local`;
const password = 'TestPassword123';

let comptableId: string;
let commercialId: string;
let comptableToken: string;
let commercialToken: string;

const createdCompteIds: string[] = [];
let testFournisseurId: string;
let testClientId: string;
let testFactureId: string;

beforeAll(async () => {
  const hash = await hashPassword(password);
  const comptable = await prisma.utilisateur.create({
    data: { email: comptableEmail, motDePasse: hash, nom: 'Test', prenom: 'Comptable', role: 'COMPTABLE' },
  });
  comptableId = comptable.id;
  const commercial = await prisma.utilisateur.create({
    data: { email: commercialEmail, motDePasse: hash, nom: 'Test', prenom: 'Commercial', role: 'COMMERCIAL' },
  });
  commercialId = commercial.id;

  comptableToken = (await request(app).post('/api/auth/login').send({ email: comptableEmail, motDePasse: password })).body.accessToken;
  commercialToken = (await request(app).post('/api/auth/login').send({ email: commercialEmail, motDePasse: password })).body.accessToken;

  const fournisseur = await prisma.fournisseur.create({ data: { nom: 'Fournisseur Finances Intégration' } });
  testFournisseurId = fournisseur.id;
  const client = await prisma.client.create({ data: { nom: 'Client Finances Intégration' } });
  testClientId = client.id;
});

afterAll(async () => {
  await prisma.mouvementTresorerie.deleteMany({ where: { compteId: { in: createdCompteIds } } });
  if (testFactureId) {
    await prisma.paiement.deleteMany({ where: { factureId: testFactureId } });
    await prisma.ligneFacture.deleteMany({ where: { factureId: testFactureId } });
    await prisma.facture.delete({ where: { id: testFactureId } });
  }
  await prisma.compteTresorerie.deleteMany({ where: { id: { in: createdCompteIds } } });
  await prisma.client.delete({ where: { id: testClientId } });
  await prisma.fournisseur.delete({ where: { id: testFournisseurId } });
  const userIds = [comptableId, commercialId];
  await prisma.refreshToken.deleteMany({ where: { utilisateurId: { in: userIds } } });
  await prisma.utilisateur.deleteMany({ where: { id: { in: userIds } } });
  await prisma.$disconnect();
});

describe('Comptes de trésorerie — RBAC et solde', () => {
  it('un COMMERCIAL ne peut pas créer de compte', async () => {
    const res = await request(app).post('/api/comptes-tresorerie').set('Authorization', `Bearer ${commercialToken}`).send({ nom: 'x' });
    expect(res.status).toBe(403);
  });

  it('le solde initial est repris tel quel avant tout mouvement', async () => {
    const res = await request(app)
      .post('/api/comptes-tresorerie')
      .set('Authorization', `Bearer ${comptableToken}`)
      .send({ nom: 'Compte Intégration', type: 'BANQUE', soldeInitial: 10000 });
    expect(res.status).toBe(201);
    createdCompteIds.push(res.body.id);

    const detail = await request(app).get(`/api/comptes-tresorerie/${res.body.id}`).set('Authorization', `Bearer ${comptableToken}`);
    expect(detail.body.solde).toBe(10000);
  });
});

describe('Mouvements de trésorerie — solde, rapprochement, échéancier', () => {
  let compteId: string;

  beforeAll(async () => {
    const compte = await prisma.compteTresorerie.create({ data: { nom: 'Compte Mouvements Intégration', soldeInitial: 5000 } });
    createdCompteIds.push(compte.id);
    compteId = compte.id;
  });

  it('un COMMERCIAL ne peut pas créer de mouvement', async () => {
    const res = await request(app)
      .post('/api/mouvements-tresorerie')
      .set('Authorization', `Bearer ${commercialToken}`)
      .send({ compteId, sens: 'ENCAISSEMENT', montant: 100, date: '2026-03-01' });
    expect(res.status).toBe(403);
  });

  it('seuls les mouvements REALISE modifient le solde — les PREVU sont exclus', async () => {
    await request(app)
      .post('/api/mouvements-tresorerie')
      .set('Authorization', `Bearer ${comptableToken}`)
      .send({ compteId, sens: 'DECAISSEMENT', statut: 'REALISE', montant: 2000, date: '2026-03-01', fournisseurId: testFournisseurId });
    await request(app)
      .post('/api/mouvements-tresorerie')
      .set('Authorization', `Bearer ${comptableToken}`)
      .send({ compteId, sens: 'ENCAISSEMENT', statut: 'REALISE', montant: 500, date: '2026-03-02' });
    await request(app)
      .post('/api/mouvements-tresorerie')
      .set('Authorization', `Bearer ${comptableToken}`)
      .send({ compteId, sens: 'DECAISSEMENT', statut: 'PREVU', montant: 9999, date: '2026-04-01', fournisseurId: testFournisseurId });

    const detail = await request(app).get(`/api/comptes-tresorerie/${compteId}`).set('Authorization', `Bearer ${comptableToken}`);
    // 5000 - 2000 + 500 = 3500 ; le PREVU de 9999 ne compte pas.
    expect(detail.body.solde).toBe(3500);
  });

  it('un mouvement rapproché ne peut plus être modifié ni supprimé', async () => {
    const mouvement = await request(app)
      .post('/api/mouvements-tresorerie')
      .set('Authorization', `Bearer ${comptableToken}`)
      .send({ compteId, sens: 'DECAISSEMENT', statut: 'REALISE', montant: 100, date: '2026-03-05' });
    const id = mouvement.body.id;

    await request(app).post(`/api/mouvements-tresorerie/${id}/rapprocher`).set('Authorization', `Bearer ${comptableToken}`).send({ rapproche: true });

    const del = await request(app).delete(`/api/mouvements-tresorerie/${id}`).set('Authorization', `Bearer ${comptableToken}`);
    expect(del.status).toBe(409);

    const upd = await request(app)
      .put(`/api/mouvements-tresorerie/${id}`)
      .set('Authorization', `Bearer ${comptableToken}`)
      .send({ montant: 200 });
    expect(upd.status).toBe(409);
  });

  it('le journal fusionne les mouvements et les paiements clients rattachés au compte', async () => {
    const facture = await request(app)
      .post('/api/factures')
      .set('Authorization', `Bearer ${comptableToken}`)
      .send({
        clientId: testClientId,
        dateEcheance: '2026-04-15',
        tauxTva: 20,
        tauxRetenueGarantie: 0,
        lignes: [{ designation: 'Travaux', unite: 'forfait', quantite: 1, prixUnitaire: 1000 }],
      });
    testFactureId = facture.body.id;
    await request(app).post(`/api/factures/${testFactureId}/envoyer`).set('Authorization', `Bearer ${comptableToken}`);
    await request(app)
      .post(`/api/factures/${testFactureId}/paiements`)
      .set('Authorization', `Bearer ${comptableToken}`)
      .send({ montant: 400, date: '2026-03-10', compteId });

    const journal = await request(app).get(`/api/mouvements-tresorerie/journal?compteId=${compteId}`).set('Authorization', `Bearer ${comptableToken}`);
    expect(journal.status).toBe(200);
    const paiementEntry = journal.body.find((e: { source: string }) => e.source === 'PAIEMENT_CLIENT');
    expect(paiementEntry).toBeDefined();
    expect(paiementEntry.montant).toBe(400);

    // 3500 (précédent) - 100 (rapproché) + 400 (paiement client) = 3800
    const detail = await request(app).get(`/api/comptes-tresorerie/${compteId}`).set('Authorization', `Bearer ${comptableToken}`);
    expect(detail.body.solde).toBe(3800);
  });

  it("l'échéancier liste la facture non soldée et le mouvement PREVU", async () => {
    const echeancier = await request(app).get('/api/mouvements-tresorerie/echeancier').set('Authorization', `Bearer ${comptableToken}`);
    expect(echeancier.status).toBe(200);
    // Facture TTC 1200, aucune retenue, 400 déjà payés -> reste 800.
    const facturePrevue = echeancier.body.encaissementsPrevus.find((f: { id: string }) => f.id === testFactureId);
    expect(facturePrevue).toBeDefined();
    expect(facturePrevue.montant).toBe(800);
    expect(echeancier.body.decaissementsPrevus.some((m: { montant: string }) => Number(m.montant) === 9999)).toBe(true);
  });
});
