import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { DocumentPrintPage } from '@/components/print/DocumentPrintPage';
import { formatDate } from '@/lib/date';
import { formatMAD } from '@/lib/currency';
import { montantEnLettres } from '@/lib/numberToWords';
import * as api from './api';

export default function FacturePrintPage() {
  const { id } = useParams<{ id: string }>();
  const { data: facture, isLoading } = useQuery({
    queryKey: ['facture', id],
    queryFn: () => api.fetchFacture(id as string),
    enabled: Boolean(id),
  });

  if (isLoading || !facture) return <p className="text-muted-foreground">Chargement…</p>;

  return (
    <DocumentPrintPage title={facture.type === 'AVOIR' ? 'Avoir' : 'Facture'} numero={facture.numero}>
      <div className="mb-6 grid grid-cols-2 gap-6 text-sm">
        <div>
          <p className="text-xs font-semibold uppercase text-black/50">Client</p>
          <p className="font-medium">{facture.client.nom}</p>
        </div>
        <div className="text-right">
          <p>
            <span className="text-black/50">Date : </span>
            {formatDate(facture.date)}
          </p>
          {facture.dateEcheance && (
            <p>
              <span className="text-black/50">Échéance : </span>
              {formatDate(facture.dateEcheance)}
            </p>
          )}
          {facture.chantier && (
            <p>
              <span className="text-black/50">Chantier : </span>
              {facture.chantier.nom}
            </p>
          )}
        </div>
      </div>

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
          {facture.lignes.map((ligne) => (
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

      <div className="mt-6 flex justify-end">
        <div className="w-64 space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-black/60">Total HT</span>
            <span>{formatMAD(facture.totaux.montantHT)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-black/60">TVA ({facture.tauxTva}%)</span>
            <span>{formatMAD(facture.totaux.montantTVA)}</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span>Total TTC</span>
            <span>{formatMAD(facture.totaux.montantTTC)}</span>
          </div>
          {Number(facture.tauxRetenueGarantie) > 0 && (
            <div className="flex justify-between">
              <span className="text-black/60">Retenue de garantie ({facture.tauxRetenueGarantie}%)</span>
              <span>-{formatMAD(facture.totaux.montantRetenueGarantie)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-black/30 pt-1 text-base font-bold">
            <span>Net à payer</span>
            <span>{formatMAD(facture.totaux.montantNetAPayer)}</span>
          </div>
          <div className="flex justify-between pt-2 text-xs">
            <span className="text-black/60">Déjà payé</span>
            <span>{formatMAD(facture.montantPaye)}</span>
          </div>
          <div className="flex justify-between text-xs font-semibold">
            <span>Restant dû</span>
            <span>{formatMAD(facture.montantRestantDu)}</span>
          </div>
        </div>
      </div>

      <p className="mt-3 text-right text-xs italic text-black/70">
        {facture.type === 'AVOIR'
          ? `Arrêté le présent avoir à la somme de : ${montantEnLettres(facture.totaux.montantNetAPayer)}.`
          : `Arrêtée la présente facture à la somme de : ${montantEnLettres(facture.totaux.montantNetAPayer)}.`}
      </p>
    </DocumentPrintPage>
  );
}
