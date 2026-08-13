import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { DocumentPrintPage } from '@/components/print/DocumentPrintPage';
import { formatDate } from '@/lib/date';
import { formatMAD } from '@/lib/currency';
import { montantEnLettres } from '@/lib/numberToWords';
import * as api from './api';

export default function CommandePrintPage() {
  const { id } = useParams<{ id: string }>();
  const { data: commande, isLoading } = useQuery({
    queryKey: ['commande', id],
    queryFn: () => api.fetchCommande(id as string),
    enabled: Boolean(id),
  });

  if (isLoading || !commande) return <p className="text-muted-foreground">Chargement…</p>;

  return (
    <DocumentPrintPage title="Bon de commande" numero={commande.numero}>
      <div className="mb-6 grid grid-cols-2 gap-6 text-sm">
        <div>
          <p className="text-xs font-semibold uppercase text-black/50">Client</p>
          <p className="font-medium">{commande.client.nom}</p>
        </div>
        <div className="text-right">
          <p>
            <span className="text-black/50">Date : </span>
            {formatDate(commande.date)}
          </p>
          {commande.chantier && (
            <p>
              <span className="text-black/50">Chantier : </span>
              {commande.chantier.nom}
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
          {commande.lignes.map((ligne) => (
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
            <span>{formatMAD(commande.totaux.montantHT)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-black/60">TVA ({commande.tauxTva}%)</span>
            <span>{formatMAD(commande.totaux.montantTVA)}</span>
          </div>
          <div className="flex justify-between border-t border-black/30 pt-1 text-base font-bold">
            <span>Total TTC</span>
            <span>{formatMAD(commande.totaux.montantTTC)}</span>
          </div>
        </div>
      </div>

      <p className="mt-3 text-right text-xs italic text-black/70">
        Arrêté le présent bon de commande à la somme de : {montantEnLettres(commande.totaux.montantNetAPayer)}.
      </p>
    </DocumentPrintPage>
  );
}
