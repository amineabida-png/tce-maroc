import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { prisma } from '../src/db/client';
import { hashPassword } from '../src/lib/password';

const app = createApp();

const comptableEmail = `test-comptable-reporting-${randomUUID()}@tce-maroc.local`;
const commercialEmail = `test-commercial-reporting-${randomUUID()}@tce-maroc.local`;
const password = 'TestPassword123';

let comptableId: string;
let commercialId: string;
let comptableToken: string;
let commercialToken: string;

let clientId: string;
let chantierId: string;
let factureId: string;
let articleId: string;

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

  const client = await prisma.client.create({ data: { nom: 'Client Reporting Intégration' } });
  clientId = client.id;
  const chantier = await prisma.chantier.create({ data: { nom: 'Chantier Reporting Intégration', clientId } });
  chantierId = chantier.id;
  const article = await prisma.article.create({ data: { nom: 'Article Reporting Intégration', unite: 'u', seuilAlerte: 100 } });
  articleId = article.id;

  const facture = await request(app)
    .post('/api/factures')
    .set('Authorization', `Bearer ${comptableToken}`)
    .send({
      clientId,
      chantierId,
      tauxTva: 20,
      tauxRetenueGarantie: 0,
      lignes: [{ designation: 'Travaux', unite: 'forfait', quantite: 1, prixUnitaire: 8000 }],
    });
  factureId = facture.body.id;
  await request(app).post(`/api/factures/${factureId}/envoyer`).set('Authorization', `Bearer ${comptableToken}`);
  await request(app)
    .post(`/api/factures/${factureId}/paiements`)
    .set('Authorization', `Bearer ${comptableToken}`)
    .send({ montant: 3000, date: new Date().toISOString().slice(0, 10) });

  await prisma.depenseChantier.create({
    data: { chantierId, categorie: 'MATERIAUX', montant: 2500, date: new Date() },
  });

  // Entrée puis sortie insuffisante pour repasser sous le seuil de 100.
  await prisma.mouvementStock.create({ data: { articleId, type: 'ENTREE', quantite: 50, prixUnitaire: 20 } });
});

afterAll(async () => {
  await prisma.paiement.deleteMany({ where: { factureId } });
  await prisma.ligneFacture.deleteMany({ where: { factureId } });
  await prisma.facture.delete({ where: { id: factureId } });
  await prisma.depenseChantier.deleteMany({ where: { chantierId } });
  await prisma.mouvementStock.deleteMany({ where: { articleId } });
  await prisma.article.delete({ where: { id: articleId } });
  await prisma.chantier.delete({ where: { id: chantierId } });
  await prisma.client.delete({ where: { id: clientId } });
  const userIds = [comptableId, commercialId];
  await prisma.refreshToken.deleteMany({ where: { utilisateurId: { in: userIds } } });
  await prisma.utilisateur.deleteMany({ where: { id: { in: userIds } } });
  await prisma.$disconnect();
});

describe('Reporting — lecture ouverte à tous les rôles authentifiés', () => {
  it('un COMMERCIAL peut consulter les rapports', async () => {
    const ca = await request(app).get('/api/reporting/ca').set('Authorization', `Bearer ${commercialToken}`);
    expect(ca.status).toBe(200);
    const marge = await request(app).get('/api/reporting/marge-chantiers').set('Authorization', `Bearer ${commercialToken}`);
    expect(marge.status).toBe(200);
    const stock = await request(app).get('/api/reporting/stock').set('Authorization', `Bearer ${commercialToken}`);
    expect(stock.status).toBe(200);
    const impayes = await request(app).get('/api/reporting/impayes').set('Authorization', `Bearer ${commercialToken}`);
    expect(impayes.status).toBe(200);
  });
});

describe('Rapport chiffre d’affaires', () => {
  it('agrège HT/TVA/TTC/encaissé du mois courant à partir des factures réelles', async () => {
    const debut = new Date();
    debut.setDate(1);
    const fin = new Date();
    fin.setMonth(fin.getMonth() + 1, 0);

    const res = await request(app)
      .get(`/api/reporting/ca?debut=${debut.toISOString().slice(0, 10)}&fin=${fin.toISOString().slice(0, 10)}&clientId=${clientId}`)
      .set('Authorization', `Bearer ${comptableToken}`);
    expect(res.status).toBe(200);
    // Filtré sur notre client de test (le total portefeuille n'est pas isolé
    // des autres suites qui facturent aussi "aujourd'hui") : 8000 HT, TVA
    // 20% -> 1600, TTC 9600, encaissé 3000.
    expect(res.body.total).toEqual({ montantHT: 8000, montantTVA: 1600, montantTTC: 9600, montantEncaisse: 3000 });
  });
});

describe('Rapport marge par chantier', () => {
  it('calcule marge = recettes facturées - dépenses réelles, sans confondre avec le coût pointages', async () => {
    const debut = new Date();
    debut.setDate(1);
    const fin = new Date();
    fin.setMonth(fin.getMonth() + 1, 0);

    const res = await request(app)
      .get(`/api/reporting/marge-chantiers?debut=${debut.toISOString().slice(0, 10)}&fin=${fin.toISOString().slice(0, 10)}`)
      .set('Authorization', `Bearer ${comptableToken}`);
    expect(res.status).toBe(200);
    const ligne = res.body.find((l: { chantierId: string }) => l.chantierId === chantierId);
    expect(ligne).toBeDefined();
    // Recettes TTC 9600, dépenses 2500 -> marge 7100.
    expect(ligne.recettesFacturees).toBe(9600);
    expect(ligne.depensesReelles).toBe(2500);
    expect(ligne.marge).toBe(7100);
    expect(ligne.coutMainDoeuvrePointages).toBe(0);
  });
});

describe('Rapport créances clients (impayés)', () => {
  it('regroupe le montant restant dû par client', async () => {
    const res = await request(app).get('/api/reporting/impayes').set('Authorization', `Bearer ${comptableToken}`);
    expect(res.status).toBe(200);
    const ligne = res.body.lignes.find((l: { clientId: string }) => l.clientId === clientId);
    expect(ligne).toBeDefined();
    // TTC 9600 - payé 3000 = 6600.
    expect(ligne.montantRestant).toBe(6600);
    expect(ligne.nombreFactures).toBe(1);
  });
});

describe('Rapport état du stock', () => {
  it('inclut la valorisation et signale les articles sous le seuil', async () => {
    const res = await request(app).get('/api/reporting/stock').set('Authorization', `Bearer ${comptableToken}`);
    expect(res.status).toBe(200);
    const ligne = res.body.lignes.find((l: { articleId: string }) => l.articleId === articleId);
    expect(ligne).toBeDefined();
    // 50 en stock, seuil 100 -> sous le seuil ; CMP 20, valorisation 1000.
    expect(ligne.quantiteEnStock).toBe(50);
    expect(ligne.valorisation).toBe(1000);
    expect(ligne.sousLeSeuil).toBe(true);
    expect(res.body.total.nombreSousSeuil).toBeGreaterThanOrEqual(1);
  });

  it('exporte le rapport stock en CSV', async () => {
    const res = await request(app).get('/api/reporting/stock/export').set('Authorization', `Bearer ${comptableToken}`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.text).toContain('Article Reporting Intégration');
  });
});
