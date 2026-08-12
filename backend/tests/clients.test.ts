import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { prisma } from '../src/db/client';
import { hashPassword } from '../src/lib/password';

const app = createApp();

// Un utilisateur par rôle pertinent, créés une fois et nettoyés à la fin —
// permet de tester le RBAC réel plutôt que de le supposer.
const commercialEmail = `test-commercial-clients-${randomUUID()}@tce-maroc.local`;
const magasinierEmail = `test-magasinier-${randomUUID()}@tce-maroc.local`;
const password = 'TestPassword123';
let commercialId: string;
let magasinierId: string;
let commercialToken: string;
let magasinierToken: string;

const createdClientIds: string[] = [];

beforeAll(async () => {
  const hash = await hashPassword(password);
  const commercial = await prisma.utilisateur.create({
    data: { email: commercialEmail, motDePasse: hash, nom: 'Test', prenom: 'Commercial', role: 'COMMERCIAL' },
  });
  commercialId = commercial.id;
  const magasinier = await prisma.utilisateur.create({
    data: { email: magasinierEmail, motDePasse: hash, nom: 'Test', prenom: 'Magasinier', role: 'MAGASINIER' },
  });
  magasinierId = magasinier.id;

  const loginCommercial = await request(app).post('/api/auth/login').send({ email: commercialEmail, motDePasse: password });
  commercialToken = loginCommercial.body.accessToken;
  const loginMagasinier = await request(app).post('/api/auth/login').send({ email: magasinierEmail, motDePasse: password });
  magasinierToken = loginMagasinier.body.accessToken;
});

afterAll(async () => {
  await prisma.client.deleteMany({ where: { id: { in: createdClientIds } } });
  await prisma.refreshToken.deleteMany({ where: { utilisateurId: { in: [commercialId, magasinierId] } } });
  await prisma.utilisateur.deleteMany({ where: { id: { in: [commercialId, magasinierId] } } });
  await prisma.$disconnect();
});

describe('Clients — CRUD + RBAC', () => {
  it('un COMMERCIAL peut créer un client', async () => {
    const res = await request(app)
      .post('/api/clients')
      .set('Authorization', `Bearer ${commercialToken}`)
      .send({ type: 'ENTREPRISE', nom: 'SARL Intégration Test', ville: 'Rabat', ice: '999888777' });
    expect(res.status).toBe(201);
    expect(res.body.nom).toBe('SARL Intégration Test');
    expect(res.body.actif).toBe(true);
    createdClientIds.push(res.body.id);
  });

  it('rejette un client sans nom (400)', async () => {
    const res = await request(app)
      .post('/api/clients')
      .set('Authorization', `Bearer ${commercialToken}`)
      .send({ type: 'ENTREPRISE' });
    expect(res.status).toBe(400);
  });

  it("un MAGASINIER ne peut pas créer de client (403 — RBAC)", async () => {
    const res = await request(app)
      .post('/api/clients')
      .set('Authorization', `Bearer ${magasinierToken}`)
      .send({ type: 'ENTREPRISE', nom: 'Ne devrait pas être créé' });
    expect(res.status).toBe(403);
  });

  it('tous les rôles authentifiés peuvent lister les clients (lecture ouverte)', async () => {
    const res = await request(app).get('/api/clients').set('Authorization', `Bearer ${magasinierToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);
  });

  it('la recherche filtre par nom', async () => {
    const res = await request(app)
      .get('/api/clients?q=Intégration')
      .set('Authorization', `Bearer ${commercialToken}`);
    expect(res.status).toBe(200);
    expect(res.body.items.some((c: { nom: string }) => c.nom === 'SARL Intégration Test')).toBe(true);
  });

  it('vider explicitement le champ email le met à null (et non undefined ignoré)', async () => {
    const create = await request(app)
      .post('/api/clients')
      .set('Authorization', `Bearer ${commercialToken}`)
      .send({ type: 'PARTICULIER', nom: 'Client Email Test', email: 'a@b.com' });
    createdClientIds.push(create.body.id);
    expect(create.body.email).toBe('a@b.com');

    const cleared = await request(app)
      .put(`/api/clients/${create.body.id}`)
      .set('Authorization', `Bearer ${commercialToken}`)
      .send({ email: '' });
    expect(cleared.body.email).toBeNull();
  });

  it('désactiver puis réactiver un client fonctionne, et le masque des listes par défaut', async () => {
    const create = await request(app)
      .post('/api/clients')
      .set('Authorization', `Bearer ${commercialToken}`)
      .send({ type: 'ENTREPRISE', nom: 'Client À Désactiver' });
    createdClientIds.push(create.body.id);
    const id = create.body.id;

    const deactivated = await request(app)
      .post(`/api/clients/${id}/desactiver`)
      .set('Authorization', `Bearer ${commercialToken}`);
    expect(deactivated.body.actif).toBe(false);

    const listDefault = await request(app)
      .get('/api/clients?q=Client À Désactiver')
      .set('Authorization', `Bearer ${commercialToken}`);
    expect(listDefault.body.items.find((c: { id: string }) => c.id === id)).toBeUndefined();

    const listIncluding = await request(app)
      .get('/api/clients?q=Client À Désactiver&includeInactifs=true')
      .set('Authorization', `Bearer ${commercialToken}`);
    expect(listIncluding.body.items.find((c: { id: string }) => c.id === id)).toBeTruthy();

    const reactivated = await request(app)
      .post(`/api/clients/${id}/reactiver`)
      .set('Authorization', `Bearer ${commercialToken}`);
    expect(reactivated.body.actif).toBe(true);
  });

  it('404 sur un client inexistant', async () => {
    const res = await request(app)
      .get('/api/clients/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${commercialToken}`);
    expect(res.status).toBe(404);
  });
});
