import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { prisma } from '../src/db/client';
import { hashPassword } from '../src/lib/password';

const app = createApp();

const comptableEmail = `test-comptable-dashboard-${randomUUID()}@tce-maroc.local`;
const commercialEmail = `test-commercial-dashboard-${randomUUID()}@tce-maroc.local`;
const password = 'TestPassword123';

let comptableId: string;
let commercialId: string;
let comptableToken: string;
let commercialToken: string;

let clientId: string;
let chantierId: string;
let factureId: string;
let compteId: string;
let employeId: string;

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

  const client = await prisma.client.create({ data: { nom: 'Client Dashboard Intégration' } });
  clientId = client.id;
  const chantier = await prisma.chantier.create({ data: { nom: 'Chantier Dashboard Intégration', clientId, statut: 'EN_COURS' } });
  chantierId = chantier.id;

  const facture = await request(app)
    .post('/api/factures')
    .set('Authorization', `Bearer ${comptableToken}`)
    .send({
      clientId,
      chantierId,
      tauxTva: 20,
      tauxRetenueGarantie: 0,
      lignes: [{ designation: 'Travaux', unite: 'forfait', quantite: 1, prixUnitaire: 4000 }],
    });
  factureId = facture.body.id;
  await request(app).post(`/api/factures/${factureId}/envoyer`).set('Authorization', `Bearer ${comptableToken}`);

  const compte = await prisma.compteTresorerie.create({ data: { nom: 'Compte Dashboard Intégration', soldeInitial: 1500 } });
  compteId = compte.id;
  const dansTroisJours = new Date();
  dansTroisJours.setDate(dansTroisJours.getDate() + 3);
  await prisma.mouvementTresorerie.create({
    data: { compteId, sens: 'DECAISSEMENT', statut: 'PREVU', montant: 300, date: dansTroisJours },
  });

  const employe = await prisma.employe.create({ data: { nom: 'Test', prenom: 'Dashboard', tauxHoraire: 40 } });
  employeId = employe.id;
  await prisma.pointage.create({ data: { employeId, date: new Date(), statut: 'PRESENT', nombreHeures: 8 } });
});

afterAll(async () => {
  await prisma.pointage.deleteMany({ where: { employeId } });
  await prisma.employe.delete({ where: { id: employeId } });
  await prisma.mouvementTresorerie.deleteMany({ where: { compteId } });
  await prisma.compteTresorerie.delete({ where: { id: compteId } });
  await prisma.paiement.deleteMany({ where: { factureId } });
  await prisma.ligneFacture.deleteMany({ where: { factureId } });
  await prisma.facture.delete({ where: { id: factureId } });
  await prisma.chantier.delete({ where: { id: chantierId } });
  await prisma.client.delete({ where: { id: clientId } });
  const userIds = [comptableId, commercialId];
  await prisma.refreshToken.deleteMany({ where: { utilisateurId: { in: userIds } } });
  await prisma.utilisateur.deleteMany({ where: { id: { in: userIds } } });
  await prisma.$disconnect();
});

describe('Dashboard', () => {
  it('un COMMERCIAL peut consulter le tableau de bord (lecture ouverte)', async () => {
    const res = await request(app).get('/api/dashboard').set('Authorization', `Bearer ${commercialToken}`);
    expect(res.status).toBe(200);
  });

  it('sans jeton — 401', async () => {
    const res = await request(app).get('/api/dashboard');
    expect(res.status).toBe(401);
  });

  it('agrège chaque KPI sans dupliquer le calcul des modules source', async () => {
    const res = await request(app).get('/api/dashboard').set('Authorization', `Bearer ${comptableToken}`);
    expect(res.status).toBe(200);

    const chantierLigne = res.body.chantiersParStatut.find((c: { statut: string }) => c.statut === 'EN_COURS');
    expect(chantierLigne).toBeDefined();
    expect(chantierLigne.nombre).toBeGreaterThanOrEqual(1);

    // 4000 HT * 1.2 = 4800 TTC, aucun paiement -> entièrement en créance.
    expect(res.body.creancesClients).toBeGreaterThanOrEqual(4800);

    // Compte créé avec 1500 de solde initial et aucun mouvement REALISE.
    expect(res.body.tresorerieDisponible).toBeGreaterThanOrEqual(1500);

    // Décaissement PREVU de 300 dans 3 jours -> dans la fenêtre 7 jours.
    expect(res.body.decaissementsPlanifies7j).toBeGreaterThanOrEqual(300);

    expect(res.body.pointagesAujourdhui).toBeGreaterThanOrEqual(1);
  });
});
