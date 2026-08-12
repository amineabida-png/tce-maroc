import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { prisma } from '../src/db/client';
import { hashPassword } from '../src/lib/password';

const app = createApp();

const auteurEmail = `test-auteur-documents-${randomUUID()}@tce-maroc.local`;
const autreEmail = `test-autre-documents-${randomUUID()}@tce-maroc.local`;
const directeurEmail = `test-directeur-documents-${randomUUID()}@tce-maroc.local`;
const password = 'TestPassword123';

let auteurId: string;
let autreId: string;
let directeurId: string;
let auteurToken: string;
let autreToken: string;
let directeurToken: string;

let chantierId: string;
const createdDocumentIds: string[] = [];

beforeAll(async () => {
  const hash = await hashPassword(password);
  const auteur = await prisma.utilisateur.create({
    data: { email: auteurEmail, motDePasse: hash, nom: 'Test', prenom: 'Auteur', role: 'CONDUCTEUR_TRAVAUX' },
  });
  auteurId = auteur.id;
  const autre = await prisma.utilisateur.create({
    data: { email: autreEmail, motDePasse: hash, nom: 'Test', prenom: 'Autre', role: 'COMMERCIAL' },
  });
  autreId = autre.id;
  const directeur = await prisma.utilisateur.create({
    data: { email: directeurEmail, motDePasse: hash, nom: 'Test', prenom: 'Directeur', role: 'DIRECTEUR' },
  });
  directeurId = directeur.id;

  auteurToken = (await request(app).post('/api/auth/login').send({ email: auteurEmail, motDePasse: password })).body.accessToken;
  autreToken = (await request(app).post('/api/auth/login').send({ email: autreEmail, motDePasse: password })).body.accessToken;
  directeurToken = (await request(app).post('/api/auth/login').send({ email: directeurEmail, motDePasse: password })).body.accessToken;

  const chantier = await prisma.chantier.create({ data: { nom: 'Chantier Documents Intégration' } });
  chantierId = chantier.id;
});

afterAll(async () => {
  await prisma.document.deleteMany({ where: { id: { in: createdDocumentIds } } });
  await prisma.chantier.delete({ where: { id: chantierId } });
  const userIds = [auteurId, autreId, directeurId];
  await prisma.refreshToken.deleteMany({ where: { utilisateurId: { in: userIds } } });
  await prisma.utilisateur.deleteMany({ where: { id: { in: userIds } } });
  await prisma.$disconnect();
});

describe('Documents — upload, téléchargement, suppression', () => {
  it('upload un fichier et le retrouve dans la liste de son entité', async () => {
    const upload = await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${auteurToken}`)
      .field('entiteType', 'CHANTIER')
      .field('entiteId', chantierId)
      .attach('fichier', Buffer.from('contenu de test'), { filename: 'plan.txt', contentType: 'text/plain' });
    expect(upload.status).toBe(201);
    expect(upload.body.nom).toBe('plan.txt');
    expect(upload.body.tailleOctets).toBe(Buffer.byteLength('contenu de test'));
    const documentId = upload.body.id;
    createdDocumentIds.push(documentId);

    const list = await request(app)
      .get(`/api/documents?entiteType=CHANTIER&entiteId=${chantierId}`)
      .set('Authorization', `Bearer ${auteurToken}`);
    expect(list.status).toBe(200);
    expect(list.body.some((d: { id: string }) => d.id === documentId)).toBe(true);
    // Les métadonnées ne renvoient jamais le contenu binaire.
    expect(list.body[0]).not.toHaveProperty('contenu');
  });

  it('télécharge le contenu exact avec le bon type MIME', async () => {
    const upload = await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${auteurToken}`)
      .field('entiteType', 'CHANTIER')
      .field('entiteId', chantierId)
      .attach('fichier', Buffer.from('autre contenu'), { filename: 'photo.txt', contentType: 'text/plain' });
    const documentId = upload.body.id;
    createdDocumentIds.push(documentId);

    const download = await request(app).get(`/api/documents/${documentId}/telecharger`).set('Authorization', `Bearer ${auteurToken}`);
    expect(download.status).toBe(200);
    expect(download.headers['content-type']).toContain('text/plain');
    expect(download.text).toBe('autre contenu');
  });

  it("seul l'auteur ou l'encadrement peut supprimer un document", async () => {
    const upload = await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${auteurToken}`)
      .field('entiteType', 'CHANTIER')
      .field('entiteId', chantierId)
      .attach('fichier', Buffer.from('x'), { filename: 'a-supprimer.txt', contentType: 'text/plain' });
    const documentId = upload.body.id;

    const refusParAutre = await request(app).delete(`/api/documents/${documentId}`).set('Authorization', `Bearer ${autreToken}`);
    expect(refusParAutre.status).toBe(403);

    const acceptedByDirecteur = await request(app).delete(`/api/documents/${documentId}`).set('Authorization', `Bearer ${directeurToken}`);
    expect(acceptedByDirecteur.status).toBe(204);
  });

  it("l'auteur peut supprimer son propre document", async () => {
    const upload = await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${auteurToken}`)
      .field('entiteType', 'CHANTIER')
      .field('entiteId', chantierId)
      .attach('fichier', Buffer.from('x'), { filename: 'auteur.txt', contentType: 'text/plain' });
    const documentId = upload.body.id;

    const res = await request(app).delete(`/api/documents/${documentId}`).set('Authorization', `Bearer ${auteurToken}`);
    expect(res.status).toBe(204);
  });

  it("rejette l'upload sans fichier (400)", async () => {
    const res = await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${auteurToken}`)
      .field('entiteType', 'CHANTIER')
      .field('entiteId', chantierId);
    expect(res.status).toBe(400);
  });
});
