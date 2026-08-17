import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { DocumentPrintPage } from '@/components/print/DocumentPrintPage';
import { formatDate } from '@/lib/date';
import { formatMAD } from '@/lib/currency';
import { montantEnLettres } from '@/lib/numberToWords';
import * as api from './api';
import * as societeApi from '@/features/societe/api';

export default function CommandePrintPage() {
  const { id } = useParams<{ id: string }>();
  const { data: commande, isLoading } = useQuery({
    queryKey: ['commande', id],
    queryFn: () => api.fetchCommande(id as string),
    enabled: Boolean(id),
  });
  const { data: societe } = useQuery({ queryKey: ['societe'], queryFn: () => societeApi.fetchSociete() });

  if (isLoading || !commande || !societe) return <p className="text-muted-foreground">Chargement…</p>;

  return (
    <DocumentPrintPage title="BON DE COMMANDE" numero={commande.numero} date={formatDate(commande.date)}>
      {({ element: cachet, primary, accent }) => (
        <>
          <div className="mb-4 grid grid-cols-2 gap-3 text-[10.5px]">
            <div className="rounded-md bg-[#f5f6f8] p-2.5">
              <p className="text-[7.8px] font-bold uppercase tracking-wide" style={{ color: accent }}>Client</p>
              <p className="font-semibold text-[#1a2330]">{commande.client.nom}</p>
              {commande.client.ice && <p className="text-[#56606c]">ICE {commande.client.ice}</p>}
              {commande.client.adresse && <p className="text-[#56606c]">{commande.client.adresse}</p>}
            </div>
            <div className="rounded-md bg-[#f5f6f8] p-2.5">
              <p className="text-[7.8px] font-bold uppercase tracking-wide" style={{ color: accent }}>Chantier</p>
              <p className="font-semibold text-[#1a2330]">{commande.chantier?.nom ?? '—'}</p>
              {commande.devis && <p className="text-[#56606c]">Issu du devis {commande.devis.numero}</p>}
            </div>
          </div>

          <table className="w-full border-collapse text-[9.6px]">
            <thead>
              <tr className="border-b-2 border-[#1a2330] text-left text-[8px] uppercase text-[#45505c]">
                <th className="py-1">Désignation</th>
                <th className="py-1 text-right">Unité</th>
                <th className="py-1 text-right">Qté</th>
                <th className="py-1 text-right">P.U. DH</th>
                <th className="py-1 text-right">Total DH</th>
              </tr>
            </thead>
            <tbody>
              {commande.lignes.map((ligne) => (
                <tr key={ligne.id} className="border-b border-[#eef0f3]">
                  <td className="py-1">{ligne.designation}</td>
                  <td className="py-1 text-right">{ligne.unite}</td>
                  <td className="py-1 text-right">{ligne.quantite}</td>
                  <td className="py-1 text-right">{formatMAD(ligne.prixUnitaire)}</td>
                  <td className="py-1 text-right">{formatMAD(Number(ligne.quantite) * Number(ligne.prixUnitaire))}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-3 flex justify-end">
            <div className="w-64 rounded-md bg-[#f5f6f8] p-2.5 text-[9.6px]">
              <div className="flex justify-between">
                <span>Total HT</span>
                <span>{formatMAD(commande.totaux.montantHT)}</span>
              </div>
              <div className="flex justify-between">
                <span>TVA ({commande.tauxTva}%)</span>
                <span>{formatMAD(commande.totaux.montantTVA)}</span>
              </div>
              <div className="mt-1 flex justify-between border-t border-[#c7cdd6] pt-1 text-[11.5px] font-extrabold" style={{ color: primary }}>
                <span>Total TTC</span>
                <span>{formatMAD(commande.totaux.montantTTC)}</span>
              </div>
            </div>
          </div>
          <p className="mt-1.5 text-right text-[9px] italic text-[#56606c]">
            Arrêté le présent bon de commande à la somme de : {montantEnLettres(commande.totaux.montantNetAPayer)}.
          </p>

          <div className="mt-auto pt-4">
            {societe.rib && <p className="mb-2 text-[8.6px] text-[#7c8794]">RIB : {societe.rib}</p>}
            <div className="rounded-t px-2 py-1 text-[7.6px] uppercase tracking-wide text-white" style={{ backgroundColor: primary }}>Validation</div>
            <div className="grid grid-cols-2 border border-[#c7cdd6]">
              <div className="border-r border-[#c7cdd6] p-2 text-[8px] text-[#56606c]">
                <b className="mb-0.5 block text-[8.6px] text-[#1a2330]">Le client — Bon pour accord</b>
                Nom, date, signature
                <div className="h-9" />
              </div>
              <div className="relative p-2 text-[8px] text-[#56606c]">
                <b className="mb-0.5 block text-[8.6px] text-[#1a2330]">Le prestataire</b>
                Cachet &amp; signature
                <div className="flex h-9 items-end justify-end">{cachet}</div>
              </div>
            </div>
          </div>
        </>
      )}
    </DocumentPrintPage>
  );
}
