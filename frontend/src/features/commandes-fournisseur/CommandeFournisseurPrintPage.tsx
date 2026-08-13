import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { DocumentPrintPage } from '@/components/print/DocumentPrintPage';
import { formatDate } from '@/lib/date';
import { formatMAD } from '@/lib/currency';
import { montantEnLettres } from '@/lib/numberToWords';
import * as api from './api';
import * as societeApi from '@/features/societe/api';

export default function CommandeFournisseurPrintPage() {
  const { id } = useParams<{ id: string }>();
  const { data: cf, isLoading } = useQuery({
    queryKey: ['commande-fournisseur', id],
    queryFn: () => api.fetchOne(id as string),
    enabled: Boolean(id),
  });
  const { data: societe } = useQuery({ queryKey: ['societe'], queryFn: () => societeApi.fetchSociete() });

  if (isLoading || !cf || !societe) return <p className="text-muted-foreground">Chargement…</p>;

  return (
    <DocumentPrintPage title="BON DE COMMANDE FOURNISSEUR" numero={cf.numero} date={formatDate(cf.date)}>
      {({ element: cachet }) => (
        <>
          <div className="mb-4 grid grid-cols-2 gap-3 text-[10.5px]">
            <div className="rounded-md bg-[#f5f6f8] p-2.5">
              <p className="text-[7.8px] font-bold uppercase tracking-wide text-[#c2691f]">Fournisseur</p>
              <p className="font-semibold text-[#1a2330]">{cf.fournisseur.nom}</p>
              {cf.fournisseur.ice && <p className="text-[#56606c]">ICE {cf.fournisseur.ice}</p>}
              {cf.fournisseur.adresse && <p className="text-[#56606c]">{cf.fournisseur.adresse}</p>}
            </div>
            <div className="rounded-md bg-[#f5f6f8] p-2.5">
              <p className="text-[7.8px] font-bold uppercase tracking-wide text-[#c2691f]">Chantier</p>
              <p className="font-semibold text-[#1a2330]">{cf.chantier?.nom ?? '—'}</p>
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
              {cf.lignes.map((ligne) => (
                <tr key={ligne.id} className="border-b border-[#eef0f3]">
                  <td className="py-1">{ligne.designation}</td>
                  <td className="py-1 text-right">{ligne.unite}</td>
                  <td className="py-1 text-right">{ligne.quantiteCommandee}</td>
                  <td className="py-1 text-right">{formatMAD(ligne.prixUnitaire)}</td>
                  <td className="py-1 text-right">{formatMAD(Number(ligne.quantiteCommandee) * Number(ligne.prixUnitaire))}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-3 flex justify-end">
            <div className="w-64 rounded-md bg-[#f5f6f8] p-2.5 text-[9.6px]">
              <div className="flex justify-between">
                <span>Total HT</span>
                <span>{formatMAD(cf.totaux.montantHT)}</span>
              </div>
              <div className="flex justify-between">
                <span>TVA ({cf.tauxTva}%)</span>
                <span>{formatMAD(cf.totaux.montantTVA)}</span>
              </div>
              <div className="mt-1 flex justify-between border-t border-[#c7cdd6] pt-1 text-[11.5px] font-extrabold text-[#1b3a66]">
                <span>Total TTC</span>
                <span>{formatMAD(cf.totaux.montantTTC)}</span>
              </div>
            </div>
          </div>
          <p className="mt-1.5 text-right text-[9px] italic text-[#56606c]">
            Arrêté le présent bon de commande à la somme de : {montantEnLettres(cf.totaux.montantNetAPayer)}.
          </p>

          <div className="mt-auto pt-4">
            <div className="rounded-t bg-[#1b3a66] px-2 py-1 text-[7.6px] uppercase tracking-wide text-white">Validation</div>
            <div className="grid grid-cols-2 border border-[#c7cdd6]">
              <div className="relative border-r border-[#c7cdd6] p-2 text-[8px] text-[#56606c]">
                <b className="mb-0.5 block text-[8.6px] text-[#1a2330]">Émis par {societe.nom}</b>
                Cachet &amp; signature
                <div className="flex h-9 items-end justify-end">{cachet}</div>
              </div>
              <div className="p-2 text-[8px] text-[#56606c]">
                <b className="mb-0.5 block text-[8.6px] text-[#1a2330]">Accusé de réception fournisseur</b>
                Nom, date, signature
                <div className="h-9" />
              </div>
            </div>
          </div>
        </>
      )}
    </DocumentPrintPage>
  );
}
