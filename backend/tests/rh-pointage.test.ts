import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { prisma } from '../src/db/client';
import { hashPassword } from '../src/lib/password';

const app = createApp();

const directeurEmail = `test-directeur-rh-${randomUUID()}@tce-maroc.local`;
const conducteurEmail = `test-conducteur-rh-${randomUUID()}@tce-maroc.local`;
const commercialEmail = `test-commercial-rh-${randomUUID()}@tce-maroc.local`;
const comptableEmail = `test-comptable-rh-${randomUUID()}@tce-maroc.local`;
const password = 'TestPassword123';

let directeurId: string;
let conducteurId: string;
let commercialId: string;
let comptableId: string;
let directeurToken: string;
let conducteurToken: string;
let commercialToken: string;
let comptableToken: string;

let testChantierId: string;
const createdEmployeIds: string[] = [];

beforeAll(async () => {
  const hash = await hashPassword(password);
  const directeur = await prisma.utilisateur.create({
    data: { email: directeurEmail, motDePasse: hash, nom: 'Test', prenom: 'Directeur', role: 'DIRECTEUR' },
  });
  directeurId = directeur.id;
  const conducteur = await prisma.utilisateur.create({
    data: { email: conducteurEmail, motDePasse: hash, nom: 'Test', prenom: 'Conducteur', role: 'CONDUCTEUR_TRAVAUX' },
  });
  conducteurId = conducteur.id;
  const commercial = await prisma.utilisateur.create({
    data: { email: commercialEmail, motDePasse: hash, nom: 'Test', prenom: 'Commercial', role: 'COMMERCIAL' },
  });
  commercialId = commercial.id;
  const comptable = await prisma.utilisateur.create({
    data: { email: comptableEmail, motDePasse: hash, nom: 'Test', prenom: 'Comptable', role: 'COMPTABLE' },
  });
  comptableId = comptable.id;

  directeurToken = (await request(app).post('/api/auth/login').send({ email: directeurEmail, motDePasse: password })).body.accessToken;
  conducteurToken = (await request(app).post('/api/auth/login').send({ email: conducteurEmail, motDePasse: password })).body.accessToken;
  commercialToken = (await request(app).post('/api/auth/login').send({ email: commercialEmail, motDePasse: password })).body.accessToken;
  comptableToken = (await request(app).post('/api/auth/login').send({ email: comptableEmail, motDePasse: password })).body.accessToken;

  const chantier = await prisma.chantier.create({ data: { nom: 'Chantier RH Intégration' } });
  testChantierId = chantier.id;
});

afterAll(async () => {
  await prisma.pointage.deleteMany({ where: { employeId: { in: createdEmployeIds } } });
  await prisma.employe.deleteMany({ where: { id: { in: createdEmployeIds } } });
  await prisma.chantier.delete({ where: { id: testChantierId } });
  const userIds = [directeurId, conducteurId, commercialId, comptableId];
  await prisma.refreshToken.deleteMany({ where: { utilisateurId: { in: userIds } } });
  await prisma.utilisateur.deleteMany({ where: { id: { in: userIds } } });
  await prisma.$disconnect();
});

describe('Employés — RBAC', () => {
  it('un COMMERCIAL ne peut pas créer un employé', async () => {
    const res = await request(app)
      .post('/api/employes')
      .set('Authorization', `Bearer ${commercialToken}`)
      .send({ nom: 'Test', prenom: 'Test' });
    expect(res.status).toBe(403);
  });

  it('un CONDUCTEUR_TRAVAUX ne peut pas créer un employé (réservé ADMIN/DIRECTEUR)', async () => {
    const res = await request(app)
      .post('/api/employes')
      .set('Authorization', `Bearer ${conducteurToken}`)
      .send({ nom: 'Test', prenom: 'Test' });
    expect(res.status).toBe(403);
  });

  it('un DIRECTEUR peut créer un employé', async () => {
    const res = await request(app)
      .post('/api/employes')
      .set('Authorization', `Bearer ${directeurToken}`)
      .send({ nom: 'Alaoui', prenom: 'Karim', poste: 'Maçon', tauxHoraire: 50 });
    expect(res.status).toBe(201);
    createdEmployeIds.push(res.body.id);
  });
});

describe('Export paie — RBAC', () => {
  it('un CONDUCTEUR_TRAVAUX ne peut pas exporter la paie', async () => {
    const res = await request(app)
      .get('/api/employes/export-paie?debut=2026-01-01&fin=2026-01-31')
      .set('Authorization', `Bearer ${conducteurToken}`);
    expect(res.status).toBe(403);
  });

  it('un COMPTABLE peut exporter la paie en CSV', async () => {
    const res = await request(app)
      .get('/api/employes/export-paie?debut=2026-01-01&fin=2026-01-31')
      .set('Authorization', `Bearer ${comptableToken}`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.text).toContain('Nom,Prénom');
  });
});

describe('Pointages — upsert idempotent et coût de main-d’œuvre', () => {
  let employeId: string;

  beforeAll(async () => {
    const employe = await prisma.employe.create({
      data: { nom: 'Bencherki', prenom: 'Omar', poste: 'Ferrailleur', tauxHoraire: 40 },
    });
    createdEmployeIds.push(employe.id);
    employeId = employe.id;
  });

  it('un COMMERCIAL ne peut pas saisir de pointage', async () => {
    const res = await request(app)
      .post('/api/pointages')
      .set('Authorization', `Bearer ${commercialToken}`)
      .send({ employeId, date: '2026-02-02', statut: 'PRESENT', nombreHeures: 8 });
    expect(res.status).toBe(403);
  });

  it('un CONDUCTEUR_TRAVAUX peut saisir un pointage, et un second envoi le même jour corrige au lieu de dupliquer', async () => {
    const create = await request(app)
      .post('/api/pointages')
      .set('Authorization', `Bearer ${conducteurToken}`)
      .send({ employeId, chantierId: testChantierId, date: '2026-02-02', statut: 'PRESENT', nombreHeures: 8 });
    expect(create.status).toBe(200);
    const pointageId = create.body.id;

    const correction = await request(app)
      .post('/api/pointages')
      .set('Authorization', `Bearer ${conducteurToken}`)
      .send({ employeId, chantierId: testChantierId, date: '2026-02-02', statut: 'PRESENT', nombreHeures: 7 });
    expect(correction.status).toBe(200);
    expect(correction.body.id).toBe(pointageId);

    const list = await request(app)
      .get(`/api/pointages?employeId=${employeId}&debut=2026-02-02&fin=2026-02-02`)
      .set('Authorization', `Bearer ${conducteurToken}`);
    expect(list.body.total).toBe(1);
    expect(list.body.items[0].nombreHeures).toBe('7');
  });

  it('calcule le coût de main-d’œuvre (heures × taux horaire) sur les pointages PRESENT uniquement', async () => {
    await request(app)
      .post('/api/pointages')
      .set('Authorization', `Bearer ${conducteurToken}`)
      .send({ employeId, chantierId: testChantierId, date: '2026-02-03', statut: 'PRESENT', nombreHeures: 6 });
    await request(app)
      .post('/api/pointages')
      .set('Authorization', `Bearer ${conducteurToken}`)
      .send({ employeId, chantierId: testChantierId, date: '2026-02-04', statut: 'ABSENT' });

    const cout = await request(app)
      .get(`/api/pointages/cout-main-doeuvre?chantierId=${testChantierId}&debut=2026-02-01&fin=2026-02-28`)
      .set('Authorization', `Bearer ${conducteurToken}`);
    expect(cout.status).toBe(200);
    // 7h (corrigé) + 6h = 13h * 40 DH = 520 DH ; le jour ABSENT n'est pas compté.
    expect(cout.body.totalHeures).toBe(13);
    expect(cout.body.totalCout).toBe(520);
    expect(cout.body.parEmploye).toEqual([{ employeId, nom: 'Bencherki', prenom: 'Omar', heures: 13, cout: 520 }]);
  });

  it('exige le paramètre chantierId', async () => {
    const res = await request(app).get('/api/pointages/cout-main-doeuvre').set('Authorization', `Bearer ${conducteurToken}`);
    expect(res.status).toBe(400);
  });
});
