import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { prisma } from '../src/db/client';
import { hashPassword } from '../src/lib/password';

const app = createApp();

const magasinierEmail = `test-magasinier-stock-${randomUUID()}@tce-maroc.local`;
const commercialEmail = `test-commercial-stock-${randomUUID()}@tce-maroc.local`;
const password = 'TestPassword123';
let magasinierId: string;
let commercialId: string;
let magasinierToken: string;
let commercialToken: string;

let testFournisseurId: string;
const createdArticleIds: string[] = [];
const createdCommandeFournisseurIds: string[] = [];

beforeAll(async () => {
  const hash = await hashPassword(password);
  const magasinier = await prisma.utilisateur.create({
    data: { email: magasinierEmail, motDePasse: hash, nom: 'Test', prenom: 'Magasinier', role: 'MAGASINIER' },
  });
  magasinierId = magasinier.id;
  const commercial = await prisma.utilisateur.create({
    data: { email: commercialEmail, motDePasse: hash, nom: 'Test', prenom: 'Commercial', role: 'COMMERCIAL' },
  });
  commercialId = commercial.id;

  magasinierToken = (await request(app).post('/api/auth/login').send({ email: magasinierEmail, motDePasse: password })).body
    .accessToken;
  commercialToken = (await request(app).post('/api/auth/login').send({ email: commercialEmail, motDePasse: password })).body
    .accessToken;

  const fournisseur = await prisma.fournisseur.create({ data: { nom: 'Fournisseur Stock Intégration' } });
  testFournisseurId = fournisseur.id;
});

afterAll(async () => {
  await prisma.mouvementStock.deleteMany({ where: { articleId: { in: createdArticleIds } } });
  await prisma.ligneCommandeFournisseur.deleteMany({ where: { commandeFournisseurId: { in: createdCommandeFournisseurIds } } });
  await prisma.commandeFournisseur.deleteMany({ where: { id: { in: createdCommandeFournisseurIds } } });
  await prisma.article.deleteMany({ where: { id: { in: createdArticleIds } } });
  await prisma.fournisseur.delete({ where: { id: testFournisseurId } });
  await prisma.refreshToken.deleteMany({ where: { utilisateurId: { in: [magasinierId, commercialId] } } });
  await prisma.utilisateur.deleteMany({ where: { id: { in: [magasinierId, commercialId] } } });
  await prisma.$disconnect();
});

describe('Articles — RBAC et seuil d’alerte', () => {
  it("un COMMERCIAL ne peut pas créer d'article", async () => {
    const res = await request(app)
      .post('/api/articles')
      .set('Authorization', `Bearer ${commercialToken}`)
      .send({ nom: 'Test', unite: 'u' });
    expect(res.status).toBe(403);
  });

  it('un article neuf a un stock à zéro et est sous le seuil dès qu’un seuil est fixé', async () => {
    const res = await request(app)
      .post('/api/articles')
      .set('Authorization', `Bearer ${magasinierToken}`)
      .send({ nom: 'Ciment CPJ45 Test', unite: 'sac', seuilAlerte: 20 });
    expect(res.status).toBe(201);
    createdArticleIds.push(res.body.id);

    const detail = await request(app).get(`/api/articles/${res.body.id}`).set('Authorization', `Bearer ${magasinierToken}`);
    expect(detail.body.stock).toEqual({ quantiteEnStock: 0, coutMoyenPondere: 0, valorisation: 0, sousLeSeuil: true });
  });
});

describe('Commande fournisseur — réception et stock', () => {
  it('la réception partielle puis totale met à jour le stock, le CMP et le statut correctement', async () => {
    const article = await request(app)
      .post('/api/articles')
      .set('Authorization', `Bearer ${magasinierToken}`)
      .send({ nom: 'Fer à béton Test', unite: 'barre', seuilAlerte: 10 });
    createdArticleIds.push(article.body.id);
    const articleId = article.body.id;

    const cf = await request(app)
      .post('/api/commandes-fournisseur')
      .set('Authorization', `Bearer ${magasinierToken}`)
      .send({
        fournisseurId: testFournisseurId,
        tauxTva: 20,
        lignes: [{ articleId, designation: 'Fer à béton', unite: 'barre', quantiteCommandee: 100, prixUnitaire: 60 }],
      });
    expect(cf.status).toBe(201);
    expect(cf.body.numero).toMatch(/^BCF-\d{4}-\d{4}$/);
    createdCommandeFournisseurIds.push(cf.body.id);
    const cfId = cf.body.id;
    const ligneId = cf.body.lignes[0].id;

    const receptionAvantEnvoi = await request(app)
      .post(`/api/commandes-fournisseur/${cfId}/reception`)
      .set('Authorization', `Bearer ${magasinierToken}`)
      .send({ lignes: [{ ligneId, quantiteRecue: 50 }] });
    expect(receptionAvantEnvoi.status).toBe(409);

    await request(app).post(`/api/commandes-fournisseur/${cfId}/statut`).set('Authorization', `Bearer ${magasinierToken}`).send({ statut: 'ENVOYEE' });

    const rec1 = await request(app)
      .post(`/api/commandes-fournisseur/${cfId}/reception`)
      .set('Authorization', `Bearer ${magasinierToken}`)
      .send({ lignes: [{ ligneId, quantiteRecue: 50 }] });
    expect(rec1.body.statut).toBe('PARTIELLEMENT_RECUE');

    const stockApres50 = await request(app).get(`/api/articles/${articleId}`).set('Authorization', `Bearer ${magasinierToken}`);
    expect(stockApres50.body.stock).toEqual({ quantiteEnStock: 50, coutMoyenPondere: 60, valorisation: 3000, sousLeSeuil: false });

    const surReception = await request(app)
      .post(`/api/commandes-fournisseur/${cfId}/reception`)
      .set('Authorization', `Bearer ${magasinierToken}`)
      .send({ lignes: [{ ligneId, quantiteRecue: 60 }] }); // 50+60=110 > 100 commandé
    expect(surReception.status).toBe(400);

    const rec2 = await request(app)
      .post(`/api/commandes-fournisseur/${cfId}/reception`)
      .set('Authorization', `Bearer ${magasinierToken}`)
      .send({ lignes: [{ ligneId, quantiteRecue: 50 }] });
    expect(rec2.body.statut).toBe('RECUE');

    const stockApres100 = await request(app).get(`/api/articles/${articleId}`).set('Authorization', `Bearer ${magasinierToken}`);
    expect(stockApres100.body.stock.quantiteEnStock).toBe(100);

    const sortieExcessive = await request(app)
      .post('/api/mouvements-stock/sortie')
      .set('Authorization', `Bearer ${magasinierToken}`)
      .send({ articleId, quantite: 150 });
    expect(sortieExcessive.status).toBe(400);

    const sortie = await request(app)
      .post('/api/mouvements-stock/sortie')
      .set('Authorization', `Bearer ${magasinierToken}`)
      .send({ articleId, quantite: 30 });
    expect(sortie.status).toBe(201);

    const stockFinal = await request(app).get(`/api/articles/${articleId}`).set('Authorization', `Bearer ${magasinierToken}`);
    expect(stockFinal.body.stock).toEqual({ quantiteEnStock: 70, coutMoyenPondere: 60, valorisation: 4200, sousLeSeuil: false });
  });
});
