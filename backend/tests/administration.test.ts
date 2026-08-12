import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { prisma } from '../src/db/client';
import { hashPassword } from '../src/lib/password';

const app = createApp();

const adminEmail = `test-admin-administration-${randomUUID()}@tce-maroc.local`;
const commercialEmail = `test-commercial-administration-${randomUUID()}@tce-maroc.local`;
const password = 'TestPassword123';

let adminId: string;
let commercialId: string;
let adminToken: string;
let commercialToken: string;

const createdUtilisateurIds: string[] = [];

beforeAll(async () => {
  const hash = await hashPassword(password);
  const admin = await prisma.utilisateur.create({
    data: { email: adminEmail, motDePasse: hash, nom: 'Test', prenom: 'Admin', role: 'ADMIN' },
  });
  adminId = admin.id;
  const commercial = await prisma.utilisateur.create({
    data: { email: commercialEmail, motDePasse: hash, nom: 'Test', prenom: 'Commercial', role: 'COMMERCIAL' },
  });
  commercialId = commercial.id;

  adminToken = (await request(app).post('/api/auth/login').send({ email: adminEmail, motDePasse: password })).body.accessToken;
  commercialToken = (await request(app).post('/api/auth/login').send({ email: commercialEmail, motDePasse: password })).body.accessToken;
});

afterAll(async () => {
  await prisma.refreshToken.deleteMany({ where: { utilisateurId: { in: [...createdUtilisateurIds, adminId, commercialId] } } });
  await prisma.utilisateur.deleteMany({ where: { id: { in: [...createdUtilisateurIds, adminId, commercialId] } } });
  await prisma.$disconnect();
});

describe('Utilisateurs — RBAC et gestion des comptes', () => {
  it('un COMMERCIAL ne peut pas créer de compte', async () => {
    const res = await request(app)
      .post('/api/utilisateurs')
      .set('Authorization', `Bearer ${commercialToken}`)
      .send({ email: `x-${randomUUID()}@tce-maroc.local`, motDePasse: 'Password123', nom: 'X', prenom: 'Y', role: 'COMMERCIAL' });
    expect(res.status).toBe(403);
  });

  it('un ADMIN peut créer un compte, et le nouvel utilisateur peut se connecter', async () => {
    const email = `nouveau-${randomUUID()}@tce-maroc.local`;
    const res = await request(app)
      .post('/api/utilisateurs')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email, motDePasse: 'Password123', nom: 'Nouvel', prenom: 'Employe', role: 'MAGASINIER' });
    expect(res.status).toBe(201);
    createdUtilisateurIds.push(res.body.id);

    const login = await request(app).post('/api/auth/login').send({ email, motDePasse: 'Password123' });
    expect(login.status).toBe(200);
  });

  it('refuse de créer un second compte avec le même email (409)', async () => {
    const email = `doublon-${randomUUID()}@tce-maroc.local`;
    const first = await request(app)
      .post('/api/utilisateurs')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email, motDePasse: 'Password123', nom: 'A', prenom: 'B', role: 'COMMERCIAL' });
    createdUtilisateurIds.push(first.body.id);

    const second = await request(app)
      .post('/api/utilisateurs')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email, motDePasse: 'AutrePassword123', nom: 'C', prenom: 'D', role: 'COMMERCIAL' });
    expect(second.status).toBe(409);
  });

  it('un ADMIN ne peut pas désactiver son propre compte', async () => {
    const res = await request(app).post(`/api/utilisateurs/${adminId}/desactiver`).set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(409);
  });

  it('désactiver puis réactiver un utilisateur fonctionne', async () => {
    const email = `cycle-${randomUUID()}@tce-maroc.local`;
    const create = await request(app)
      .post('/api/utilisateurs')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email, motDePasse: 'Password123', nom: 'Cycle', prenom: 'Test', role: 'COMMERCIAL' });
    const id = create.body.id;
    createdUtilisateurIds.push(id);

    const deactivated = await request(app).post(`/api/utilisateurs/${id}/desactiver`).set('Authorization', `Bearer ${adminToken}`);
    expect(deactivated.body.actif).toBe(false);

    const listActifs = await request(app).get('/api/utilisateurs').set('Authorization', `Bearer ${adminToken}`);
    expect(listActifs.body.some((u: { id: string }) => u.id === id)).toBe(false);

    const reactivated = await request(app).post(`/api/utilisateurs/${id}/reactiver`).set('Authorization', `Bearer ${adminToken}`);
    expect(reactivated.body.actif).toBe(true);
  });

  it("réinitialiser le mot de passe change l'accès et révoque les sessions existantes", async () => {
    const email = `reset-${randomUUID()}@tce-maroc.local`;
    const create = await request(app)
      .post('/api/utilisateurs')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email, motDePasse: 'MotDePasseInitial1', nom: 'Reset', prenom: 'Test', role: 'COMMERCIAL' });
    const id = create.body.id;
    createdUtilisateurIds.push(id);

    const login = await request(app).post('/api/auth/login').send({ email, motDePasse: 'MotDePasseInitial1' });
    const refreshToken = login.body.refreshToken;

    const reset = await request(app)
      .post(`/api/utilisateurs/${id}/reinitialiser-mot-de-passe`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nouveauMotDePasse: 'NouveauMotDePasse2' });
    expect(reset.status).toBe(204);

    const oldLogin = await request(app).post('/api/auth/login').send({ email, motDePasse: 'MotDePasseInitial1' });
    expect(oldLogin.status).toBe(401);

    const newLogin = await request(app).post('/api/auth/login').send({ email, motDePasse: 'NouveauMotDePasse2' });
    expect(newLogin.status).toBe(200);

    const refresh = await request(app).post('/api/auth/refresh').send({ refreshToken });
    expect(refresh.status).toBe(401);
  });
});

describe('Journal d’audit — réservé à l’encadrement', () => {
  it('un COMMERCIAL ne peut pas consulter le journal d’audit', async () => {
    const res = await request(app).get('/api/administration/journal-audit').set('Authorization', `Bearer ${commercialToken}`);
    expect(res.status).toBe(403);
  });

  it('un ADMIN peut consulter le journal et y retrouve ses propres actions', async () => {
    const res = await request(app)
      .get(`/api/administration/journal-audit?action=CREATE_UTILISATEUR&utilisateurId=${adminId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.total).toBeGreaterThanOrEqual(1);
    expect(res.body.items.every((e: { action: string }) => e.action === 'CREATE_UTILISATEUR')).toBe(true);
  });
});
