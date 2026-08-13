import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { DocumentPrintPage } from '@/components/print/DocumentPrintPage';
import { formatDate } from '@/lib/date';
import { formatMAD } from '@/lib/currency';
import { montantEnLettres } from '@/lib/numberToWords';
import * as api from './api';

export default function DevisPrintPage() {
  const { id } = useParams<{ id: string }>();
  const { data: devis, isLoading } = useQuery({
    queryKey: ['devis', id],
    queryFn: () => api.fetchDevis(id as string),
    enabled: Boolean(id),
  });

  if (isLoading || !devis) return <p className="text-muted-foreground">Chargement…</p>;

  const lots = [...devis.lots.map((l) => ({ nom: l.nom, lignes: l.lignes })), ...(devis.lignesSansLot.length ? [{ nom: null, lignes: devis.lignesSansLot }] : [])];

  return (
    <DocumentPrintPage title="Devis" numero={devis.numero}>
      <div className="mb-6 grid grid-cols-2 gap-6 text-sm">
        <div>
          <p className="text-xs font-semibold uppercase text-black/50">Client</p>
          <p className="font-medium">{devis.client.nom}</p>
        </div>
        <div className="text-right">
          <p>
            <span className="text-black/50">Date : </span>
            {formatDate(devis.date)}
          </p>
          {devis.dateValidite && (
            <p>
              <span className="text-black/50">Valable jusqu'au : </span>
              {formatDate(devis.dateValidite)}
            </p>
          )}
          {devis.chantier && (
            <p>
              <span className="text-black/50">Chantier : </span>
              {devis.chantier.nom}
            </p>
          )}
        </div>
      </div>

      {lots.map((lot, i) => (
        <div key={i} className="mb-4">
          {lot.nom && <p className="mb-1 font-semibold">{lot.nom}</p>}
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-black/30 text-left text-xs uppercase text-black/60">
                <th className="py-1.5">Désignation</th>
                <th className="py-1.5 text-right">Unité</th>
                <th className="py-1.5 text-right">Qté</th>
                <th className="py-1.5 text-right">P.U. (DH)</th>
                <th className="py-1.5 text-right">Total (DH)</th>
              </tr>
            </thead>
            <tbody>
              {lot.lignes.map((ligne) => (
                <tr key={ligne.id} className="border-b border-black/10">
                  <td className="py-1.5">{ligne.designation}</td>
                  <td className="py-1.5 text-right">{ligne.unite}</td>
                  <td className="py-1.5 text-right">{ligne.quantite}</td>
                  <td className="py-1.5 text-right">{formatMAD(ligne.prixUnitaire)}</td>
                  <td className="py-1.5 text-right">{formatMAD(Number(ligne.quantite) * Number(ligne.prixUnitaire))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      <div className="mt-6 flex justify-end">
        <div className="w-64 space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-black/60">Total HT</span>
            <span>{formatMAD(devis.totaux.montantHT)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-black/60">TVA ({devis.tauxTva}%)</span>
            <span>{formatMAD(devis.totaux.montantTVA)}</span>
          </div>
          <div className="flex justify-between border-t border-black/30 pt-1 text-base font-bold">
            <span>Total TTC</span>
            <span>{formatMAD(devis.totaux.montantTTC)}</span>
          </div>
        </div>
      </div>

      <p className="mt-3 text-right text-xs italic text-black/70">
        Arrêté le présent devis à la somme de : {montantEnLettres(devis.totaux.montantNetAPayer)}.
      </p>

      {devis.conditions && (
        <div className="mt-8 text-sm">
          <p className="mb-1 font-semibold">Conditions</p>
          <p className="whitespace-pre-wrap text-black/70">{devis.conditions}</p>
        </div>
      )}
    </DocumentPrintPage>
  );
}
