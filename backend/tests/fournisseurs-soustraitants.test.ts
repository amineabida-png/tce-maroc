import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { prisma } from '../src/db/client';
import { hashPassword } from '../src/lib/password';

const app = createApp();

const magasinierEmail = `test-magasinier-fourn-${randomUUID()}@tce-maroc.local`;
const conducteurEmail = `test-conducteur-${randomUUID()}@tce-maroc.local`;
const commercialEmail = `test-commercial-fourn-${randomUUID()}@tce-maroc.local`;
const password = 'TestPassword123';
let magasinierId: string;
let conducteurId: string;
let commercialId: string;
let magasinierToken: string;
let conducteurToken: string;
let commercialToken: string;

const createdFournisseurIds: string[] = [];
const createdSousTraitantIds: string[] = [];

beforeAll(async () => {
  const hash = await hashPassword(password);
  const magasinier = await prisma.utilisateur.create({
    data: { email: magasinierEmail, motDePasse: hash, nom: 'Test', prenom: 'Magasinier', role: 'MAGASINIER' },
  });
  magasinierId = magasinier.id;
  const conducteur = await prisma.utilisateur.create({
    data: { email: conducteurEmail, motDePasse: hash, nom: 'Test', prenom: 'Conducteur', role: 'CONDUCTEUR_TRAVAUX' },
  });
  conducteurId = conducteur.id;
  const commercial = await prisma.utilisateur.create({
    data: { email: commercialEmail, motDePasse: hash, nom: 'Test', prenom: 'Commercial', role: 'COMMERCIAL' },
  });
  commercialId = commercial.id;

  magasinierToken = (await request(app).post('/api/auth/login').send({ email: magasinierEmail, motDePasse: password }))
    .body.accessToken;
  conducteurToken = (await request(app).post('/api/auth/login').send({ email: conducteurEmail, motDePasse: password }))
    .body.accessToken;
  commercialToken = (await request(app).post('/api/auth/login').send({ email: commercialEmail, motDePasse: password }))
    .body.accessToken;
});

afterAll(async () => {
  await prisma.fournisseur.deleteMany({ where: { id: { in: createdFournisseurIds } } });
  await prisma.sousTraitant.deleteMany({ where: { id: { in: createdSousTraitantIds } } });
  await prisma.refreshToken.deleteMany({ where: { utilisateurId: { in: [magasinierId, conducteurId, commercialId] } } });
  await prisma.utilisateur.deleteMany({ where: { id: { in: [magasinierId, conducteurId, commercialId] } } });
  await prisma.$disconnect();
});

describe('Fournisseurs — CRUD + RBAC', () => {
  it('un MAGASINIER peut créer un fournisseur', async () => {
    const res = await request(app)
      .post('/api/fournisseurs')
      .set('Authorization', `Bearer ${magasinierToken}`)
      .send({ nom: 'Ciments Test', categorie: 'Matériaux', evaluation: 4 });
    expect(res.status).toBe(201);
    createdFournisseurIds.push(res.body.id);
  });

  it("un COMMERCIAL ne peut pas créer de fournisseur (403 — RBAC)", async () => {
    const res = await request(app)
      .post('/api/fournisseurs')
      .set('Authorization', `Bearer ${commercialToken}`)
      .send({ nom: 'Ne devrait pas être créé' });
    expect(res.status).toBe(403);
  });

  it('rejette une évaluation hors de 1..5', async () => {
    const res = await request(app)
      .post('/api/fournisseurs')
      .set('Authorization', `Bearer ${magasinierToken}`)
      .send({ nom: 'Mauvaise évaluation', evaluation: 7 });
    expect(res.status).toBe(400);
  });
});

describe('Sous-traitants — CRUD + RBAC', () => {
  it('un CONDUCTEUR_TRAVAUX peut créer un sous-traitant', async () => {
    const res = await request(app)
      .post('/api/sous-traitants')
      .set('Authorization', `Bearer ${conducteurToken}`)
      .send({ nom: 'Elec Pro Test', corpsDetat: 'Électricité', evaluation: 5 });
    expect(res.status).toBe(201);
    createdSousTraitantIds.push(res.body.id);
  });

  it("un MAGASINIER ne peut pas créer de sous-traitant (403 — RBAC)", async () => {
    const res = await request(app)
      .post('/api/sous-traitants')
      .set('Authorization', `Bearer ${magasinierToken}`)
      .send({ nom: 'Ne devrait pas être créé' });
    expect(res.status).toBe(403);
  });

  it('lecture ouverte à tous les rôles authentifiés', async () => {
    const res = await request(app).get('/api/sous-traitants').set('Authorization', `Bearer ${commercialToken}`);
    expect(res.status).toBe(200);
  });
});
