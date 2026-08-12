import type { Request, Response } from 'express';
import { toCsv } from '../../lib/csv';
import * as service from './service';

function strParam(v: unknown): string | undefined {
  return typeof v === 'string' ? v : undefined;
}
function range(req: Request) {
  return { debut: strParam(req.query.debut), fin: strParam(req.query.fin) };
}

export async function getCAHandler(req: Request, res: Response): Promise<void> {
  res.json(await service.getRapportCA(range(req), { clientId: strParam(req.query.clientId), chantierId: strParam(req.query.chantierId) }));
}

export async function exportCAHandler(req: Request, res: Response): Promise<void> {
  const { lignes } = await service.getRapportCA(range(req), { clientId: strParam(req.query.clientId), chantierId: strParam(req.query.chantierId) });
  const csv = toCsv(lignes, [
    { key: 'periode', label: 'Période' },
    { key: 'montantHT', label: 'Montant HT (DH)' },
    { key: 'montantTVA', label: 'Montant TVA (DH)' },
    { key: 'montantTTC', label: 'Montant TTC (DH)' },
    { key: 'montantEncaisse', label: 'Montant encaissé (DH)' },
  ]);
  res.set({ 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="chiffre_affaires.csv"' });
  res.end(csv);
}

export async function getMargeChantiersHandler(req: Request, res: Response): Promise<void> {
  res.json(await service.getRapportMargeChantiers(range(req)));
}

export async function exportMargeChantiersHandler(req: Request, res: Response): Promise<void> {
  const lignes = await service.getRapportMargeChantiers(range(req));
  const csv = toCsv(lignes, [
    { key: 'chantierNom', label: 'Chantier' },
    { key: 'recettesFacturees', label: 'Recettes facturées (DH)' },
    { key: 'depensesReelles', label: 'Dépenses réelles (DH)' },
    { key: 'marge', label: 'Marge (DH)' },
    { key: 'coutMainDoeuvrePointages', label: "Coût main-d'œuvre pointages (DH, indicatif)" },
  ]);
  res.set({ 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="marge_chantiers.csv"' });
  res.end(csv);
}

export async function getStockHandler(_req: Request, res: Response): Promise<void> {
  res.json(await service.getRapportStock());
}

export async function exportStockHandler(_req: Request, res: Response): Promise<void> {
  const { lignes } = await service.getRapportStock();
  const rows = lignes.map((l) => ({ ...l, sousLeSeuil: l.sousLeSeuil ? 'Oui' : 'Non' }));
  const csv = toCsv(rows, [
    { key: 'nom', label: 'Article' },
    { key: 'categorie', label: 'Catégorie' },
    { key: 'unite', label: 'Unité' },
    { key: 'quantiteEnStock', label: 'Quantité en stock' },
    { key: 'coutMoyenPondere', label: 'CMP (DH)' },
    { key: 'valorisation', label: 'Valorisation (DH)' },
    { key: 'sousLeSeuil', label: 'Sous le seuil' },
  ]);
  res.set({ 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="etat_stock.csv"' });
  res.end(csv);
}

export async function getImpayesHandler(_req: Request, res: Response): Promise<void> {
  res.json(await service.getRapportImpayes());
}

export async function exportImpayesHandler(_req: Request, res: Response): Promise<void> {
  const { lignes } = await service.getRapportImpayes();
  const csv = toCsv(lignes, [
    { key: 'clientNom', label: 'Client' },
    { key: 'nombreFactures', label: 'Nombre de factures impayées' },
    { key: 'montantRestant', label: 'Montant restant dû (DH)' },
  ]);
  res.set({ 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="impayes_clients.csv"' });
  res.end(csv);
}
