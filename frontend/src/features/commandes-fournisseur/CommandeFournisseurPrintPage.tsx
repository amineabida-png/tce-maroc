import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { DocumentPrintPage } from '@/components/print/DocumentPrintPage';
import { formatDate } from '@/lib/date';
import { formatMAD } from '@/lib/currency';
import { montantEnLettres } from '@/lib/numberToWords';
import * as api from './api';

export default function CommandeFournisseurPrintPage() {
  const { id } = useParams<{ id: string }>();
  const { data: cf, isLoading } = useQuery({
    queryKey: ['commande-fournisseur', id],
    queryFn: () => api.fetchOne(id as string),
    enabled: Boolean(id),
  });

  if (isLoading || !cf) return <p className="text-muted-foreground">Chargement…</p>;

  return (
    <DocumentPrintPage title="Bon de commande fournisseur" numero={cf.numero}>
      <div className="mb-6 grid grid-cols-2 gap-6 text-sm">
        <div>
          <p className="text-xs font-semibold uppercase text-black/50">Fournisseur</p>
          <p className="font-medium">{cf.fournisseur.nom}</p>
        </div>
        <div className="text-right">
          <p>
            <span className="text-black/50">Date : </span>
            {formatDate(cf.date)}
          </p>
          {cf.chantier && (
            <p>
              <span className="text-black/50">Chantier : </span>
              {cf.chantier.nom}
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
          {cf.lignes.map((ligne) => (
            <tr key={ligne.id} className="border-b border-black/10">
              <td className="py-1.5">{ligne.designation}</td>
              <td className="py-1.5 text-right">{ligne.unite}</td>
              <td className="py-1.5 text-right">{ligne.quantiteCommandee}</td>
              <td className="py-1.5 text-right">{formatMAD(ligne.prixUnitaire)}</td>
              <td className="py-1.5 text-right">{formatMAD(Number(ligne.quantiteCommandee) * Number(ligne.prixUnitaire))}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-6 flex justify-end">
        <div className="w-64 space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-black/60">Total HT</span>
            <span>{formatMAD(cf.totaux.montantHT)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-black/60">TVA ({cf.tauxTva}%)</span>
            <span>{formatMAD(cf.totaux.montantTVA)}</span>
          </div>
          <div className="flex justify-between border-t border-black/30 pt-1 text-base font-bold">
            <span>Total TTC</span>
            <span>{formatMAD(cf.totaux.montantTTC)}</span>
          </div>
        </div>
      </div>

      <p className="mt-3 text-right text-xs italic text-black/70">
        Arrêté le présent bon de commande à la somme de : {montantEnLettres(cf.totaux.montantNetAPayer)}.
      </p>
    </DocumentPrintPage>
  );
}
