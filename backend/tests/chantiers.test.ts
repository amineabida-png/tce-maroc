import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { prisma } from '../src/db/client';
import { hashPassword } from '../src/lib/password';

const app = createApp();

const conducteurEmail = `test-conducteur-chantiers-${randomUUID()}@tce-maroc.local`;
const comptableEmail = `test-comptable-${randomUUID()}@tce-maroc.local`;
const commercialEmail = `test-commercial-chantiers-${randomUUID()}@tce-maroc.local`;
const password = 'TestPassword123';
let conducteurId: string;
let comptableId: string;
let commercialId: string;
let conducteurToken: string;
let comptableToken: string;
let commercialToken: string;

let testClientId: string;
let testFournisseurId: string;
const createdChantierIds: string[] = [];

beforeAll(async () => {
  const hash = await hashPassword(password);
  const conducteur = await prisma.utilisateur.create({
    data: { email: conducteurEmail, motDePasse: hash, nom: 'Test', prenom: 'Conducteur', role: 'CONDUCTEUR_TRAVAUX' },
  });
  conducteurId = conducteur.id;
  const comptable = await prisma.utilisateur.create({
    data: { email: comptableEmail, motDePasse: hash, nom: 'Test', prenom: 'Comptable', role: 'COMPTABLE' },
  });
  comptableId = comptable.id;
  const commercial = await prisma.utilisateur.create({
    data: { email: commercialEmail, motDePasse: hash, nom: 'Test', prenom: 'Commercial', role: 'COMMERCIAL' },
  });
  commercialId = commercial.id;

  conducteurToken = (await request(app).post('/api/auth/login').send({ email: conducteurEmail, motDePasse: password }))
    .body.accessToken;
  comptableToken = (await request(app).post('/api/auth/login').send({ email: comptableEmail, motDePasse: password })).body
    .accessToken;
  commercialToken = (await request(app).post('/api/auth/login').send({ email: commercialEmail, motDePasse: password }))
    .body.accessToken;

  const client = await prisma.client.create({ data: { type: 'ENTREPRISE', nom: 'Client Chantier Intégration' } });
  testClientId = client.id;
  const fournisseur = await prisma.fournisseur.create({ data: { nom: 'Fournisseur Chantier Intégration' } });
  testFournisseurId = fournisseur.id;
});

afterAll(async () => {
  await prisma.chantier.deleteMany({ where: { id: { in: createdChantierIds } } }); // cascade taches + dépenses
  await prisma.client.delete({ where: { id: testClientId } });
  await prisma.fournisseur.delete({ where: { id: testFournisseurId } });
  await prisma.refreshToken.deleteMany({ where: { utilisateurId: { in: [conducteurId, comptableId, commercialId] } } });
  await prisma.utilisateur.deleteMany({ where: { id: { in: [conducteurId, comptableId, commercialId] } } });
  await prisma.$disconnect();
});

describe('Chantiers — CRUD + RBAC', () => {
  it('un CONDUCTEUR_TRAVAUX peut créer un chantier', async () => {
    const res = await request(app)
      .post('/api/chantiers')
      .set('Authorization', `Bearer ${conducteurToken}`)
      .send({
        nom: 'Chantier Intégration Test',
        clientId: testClientId,
        ville: 'Casablanca',
        budgetPrevisionnel: 100000,
        statut: 'EN_COURS',
        avancement: 10,
      });
    expect(res.status).toBe(201);
    expect(res.body.client.nom).toBe('Client Chantier Intégration');
    createdChantierIds.push(res.body.id);
  });

  it("un COMMERCIAL ne peut pas créer de chantier (403 — RBAC)", async () => {
    const res = await request(app)
      .post('/api/chantiers')
      .set('Authorization', `Bearer ${commercialToken}`)
      .send({ nom: 'Ne devrait pas être créé' });
    expect(res.status).toBe(403);
  });

  it('lecture ouverte à tous les rôles authentifiés', async () => {
    const res = await request(app).get('/api/chantiers').set('Authorization', `Bearer ${commercialToken}`);
    expect(res.status).toBe(200);
  });
});

describe('Chantiers — planning (tâches)', () => {
  it('crée deux tâches chaînées et les liste dans le bon ordre', async () => {
    const chantier = await request(app)
      .post('/api/chantiers')
      .set('Authorization', `Bearer ${conducteurToken}`)
      .send({ nom: 'Chantier Planning Test' });
    createdChantierIds.push(chantier.body.id);
    const chantierId = chantier.body.id;

    const t1 = await request(app)
      .post(`/api/chantiers/${chantierId}/taches`)
      .set('Authorization', `Bearer ${conducteurToken}`)
      .send({ nom: 'Fondations', dateDebut: '2026-01-01', dateFin: '2026-01-15', ordre: 1 });
    expect(t1.status).toBe(201);

    const t2 = await request(app)
      .post(`/api/chantiers/${chantierId}/taches`)
      .set('Authorization', `Bearer ${conducteurToken}`)
      .send({ nom: 'Élévation', dateDebut: '2026-01-16', dateFin: '2026-02-15', ordre: 2, predecesseurId: t1.body.id });
    expect(t2.status).toBe(201);
    expect(t2.body.predecesseurId).toBe(t1.body.id);

    const list = await request(app).get(`/api/chantiers/${chantierId}/taches`).set('Authorization', `Bearer ${conducteurToken}`);
    expect(list.body.map((t: { nom: string }) => t.nom)).toEqual(['Fondations', 'Élévation']);
  });

  it("un CONDUCTEUR_TRAVAUX peut supprimer une tâche, ce qui libère le prédécesseur du successeur (pas de suppression en cascade)", async () => {
    const chantier = await request(app)
      .post('/api/chantiers')
      .set('Authorization', `Bearer ${conducteurToken}`)
      .send({ nom: 'Chantier Suppression Tache Test' });
    createdChantierIds.push(chantier.body.id);
    const chantierId = chantier.body.id;

    const t1 = await request(app)
      .post(`/api/chantiers/${chantierId}/taches`)
      .set('Authorization', `Bearer ${conducteurToken}`)
      .send({ nom: 'A', ordre: 1 });
    const t2 = await request(app)
      .post(`/api/chantiers/${chantierId}/taches`)
      .set('Authorization', `Bearer ${conducteurToken}`)
      .send({ nom: 'B', ordre: 2, predecesseurId: t1.body.id });

    const del = await request(app)
      .delete(`/api/chantiers/${chantierId}/taches/${t1.body.id}`)
      .set('Authorization', `Bearer ${conducteurToken}`);
    expect(del.status).toBe(204);

    const list = await request(app).get(`/api/chantiers/${chantierId}/taches`).set('Authorization', `Bearer ${conducteurToken}`);
    const remaining = list.body.find((t: { id: string }) => t.id === t2.body.id);
    expect(remaining.predecesseurId).toBeNull();
  });
});

describe('Chantiers — dépenses et budget', () => {
  it('le résumé budgétaire calcule correctement le total réel et l’écart', async () => {
    const chantier = await request(app)
      .post('/api/chantiers')
      .set('Authorization', `Bearer ${conducteurToken}`)
      .send({ nom: 'Chantier Budget Test', budgetPrevisionnel: 200000 });
    createdChantierIds.push(chantier.body.id);
    const chantierId = chantier.body.id;

    await request(app)
      .post(`/api/chantiers/${chantierId}/depenses`)
      .set('Authorization', `Bearer ${comptableToken}`)
      .send({ categorie: 'MATERIAUX', montant: 50000, date: '2026-01-10', fournisseurId: testFournisseurId });
    await request(app)
      .post(`/api/chantiers/${chantierId}/depenses`)
      .set('Authorization', `Bearer ${comptableToken}`)
      .send({ categorie: 'MAIN_DOEUVRE', montant: 30000, date: '2026-01-20' });

    const budget = await request(app)
      .get(`/api/chantiers/${chantierId}/budget`)
      .set('Authorization', `Bearer ${conducteurToken}`);
    expect(budget.body.budgetPrevisionnel).toBe(200000);
    expect(budget.body.totalReel).toBe(80000);
    expect(budget.body.ecart).toBe(120000);
  });

  it("un COMMERCIAL ne peut pas ajouter de dépense (403 — RBAC)", async () => {
    const chantier = await request(app)
      .post('/api/chantiers')
      .set('Authorization', `Bearer ${conducteurToken}`)
      .send({ nom: 'Chantier RBAC Dépense Test' });
    createdChantierIds.push(chantier.body.id);

    const res = await request(app)
      .post(`/api/chantiers/${chantier.body.id}/depenses`)
      .set('Authorization', `Bearer ${commercialToken}`)
      .send({ categorie: 'AUTRE', montant: 1000, date: '2026-01-01' });
    expect(res.status).toBe(403);
  });

  it('rejette une dépense avec un montant négatif ou nul', async () => {
    const chantier = await request(app)
      .post('/api/chantiers')
      .set('Authorization', `Bearer ${conducteurToken}`)
      .send({ nom: 'Chantier Validation Dépense Test' });
    createdChantierIds.push(chantier.body.id);

    const res = await request(app)
      .post(`/api/chantiers/${chantier.body.id}/depenses`)
      .set('Authorization', `Bearer ${comptableToken}`)
      .send({ categorie: 'AUTRE', montant: -500, date: '2026-01-01' });
    expect(res.status).toBe(400);
  });
});
