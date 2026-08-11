import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { prisma } from '../src/db/client';
import { hashPassword } from '../src/lib/password';

const app = createApp();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@tce-maroc.local';
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD; // fourni par le script de test, voir README

// Utilisateur jetable créé pour vérifier le RBAC (rôle non-admin refusé sur
// une route réservée aux admins), supprimé après les tests.
const commercialEmail = `test-commercial-${randomUUID()}@tce-maroc.local`;
let commercialUserId: string;
const commercialPassword = 'CommercialTest123';

beforeAll(async () => {
  const hash = await hashPassword(commercialPassword);
  const user = await prisma.utilisateur.create({
    data: { email: commercialEmail, motDePasse: hash, nom: 'Test', prenom: 'Commercial', role: 'COMMERCIAL' },
  });
  commercialUserId = user.id;
});

afterAll(async () => {
  await prisma.refreshToken.deleteMany({ where: { utilisateurId: commercialUserId } });
  await prisma.utilisateur.delete({ where: { id: commercialUserId } });
  await prisma.$disconnect();
});

describe('POST /api/auth/login', () => {
  it('rejette un corps invalide (400)', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'pas-un-email' });
    expect(res.status).toBe(400);
  });

  it('rejette un mauvais mot de passe avec un message générique (401)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: ADMIN_EMAIL, motDePasse: 'clairement-faux' });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Email ou mot de passe incorrect.');
  });

  it('rejette un email inconnu avec le même message générique (401)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'personne@nowhere.local', motDePasse: 'peu importe' });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Email ou mot de passe incorrect.');
  });

  it.skipIf(!ADMIN_PASSWORD)('connecte avec les bons identifiants et retourne les jetons', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: ADMIN_EMAIL, motDePasse: ADMIN_PASSWORD });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeTruthy();
    expect(res.body.refreshToken).toBeTruthy();
    expect(res.body.user.email).toBe(ADMIN_EMAIL);
  });
});

describe('Route protégée /api/auth/me', () => {
  it('refuse sans jeton (401)', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('refuse avec un jeton invalide (401)', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', 'Bearer ceci-nest-pas-un-jwt');
    expect(res.status).toBe(401);
  });

  it('accepte avec un jeton valide', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: commercialEmail, motDePasse: commercialPassword });
    expect(login.status).toBe(200);

    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${login.body.accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe(commercialUserId);
    expect(res.body.user.role).toBe('COMMERCIAL');
  });
});

describe('POST /api/auth/refresh — rotation', () => {
  it('émet de nouveaux jetons et invalide immédiatement l’ancien refresh token', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: commercialEmail, motDePasse: commercialPassword });
    const originalRefresh = login.body.refreshToken;

    const refreshed = await request(app).post('/api/auth/refresh').send({ refreshToken: originalRefresh });
    expect(refreshed.status).toBe(200);
    expect(refreshed.body.accessToken).toBeTruthy();
    expect(refreshed.body.refreshToken).not.toBe(originalRefresh);

    const reused = await request(app).post('/api/auth/refresh').send({ refreshToken: originalRefresh });
    expect(reused.status).toBe(401);
  });
});

describe('RBAC — PUT /api/societe', () => {
  it('refuse un rôle non autorisé (COMMERCIAL) avec 403', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: commercialEmail, motDePasse: commercialPassword });

    const res = await request(app)
      .put('/api/societe')
      .set('Authorization', `Bearer ${login.body.accessToken}`)
      .send({ nom: 'Tentative non autorisée' });
    expect(res.status).toBe(403);
  });
});
