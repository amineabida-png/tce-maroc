import { Fragment } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { DocumentPrintPage } from '@/components/print/DocumentPrintPage';
import { formatDate } from '@/lib/date';
import { formatMAD } from '@/lib/currency';
import { montantEnLettres } from '@/lib/numberToWords';
import * as api from './api';
import * as societeApi from '@/features/societe/api';

export default function DevisPrintPage() {
  const { id } = useParams<{ id: string }>();
  const { data: devis, isLoading } = useQuery({
    queryKey: ['devis', id],
    queryFn: () => api.fetchDevis(id as string),
    enabled: Boolean(id),
  });
  const { data: societe } = useQuery({ queryKey: ['societe'], queryFn: () => societeApi.fetchSociete() });

  if (isLoading || !devis || !societe) return <p className="text-muted-foreground">Chargement…</p>;

  const lots = [
    ...devis.lots.map((l) => ({ nom: l.nom, lignes: l.lignes })),
    ...(devis.lignesSansLot.length ? [{ nom: null, lignes: devis.lignesSansLot }] : []),
  ];

  function sousTotal(lignes: { quantite: string; prixUnitaire: string }[]) {
    return lignes.reduce((sum, l) => sum + Number(l.quantite) * Number(l.prixUnitaire), 0);
  }

  return (
    <DocumentPrintPage title="DEVIS" numero={devis.numero} date={formatDate(devis.date)}>
      {({ element: cachet }) => (
        <>
          <div className="mb-4 grid grid-cols-2 gap-3 text-[10.5px]">
            <div className="rounded-md bg-[#f5f6f8] p-2.5">
              <p className="text-[7.8px] font-bold uppercase tracking-wide text-[#c2691f]">Client</p>
              <p className="font-semibold text-[#1a2330]">{devis.client.nom}</p>
              {devis.client.ice && <p className="text-[#56606c]">ICE {devis.client.ice}</p>}
              {devis.client.adresse && <p className="text-[#56606c]">{devis.client.adresse}</p>}
            </div>
            <div className="rounded-md bg-[#f5f6f8] p-2.5">
              <p className="text-[7.8px] font-bold uppercase tracking-wide text-[#c2691f]">Chantier</p>
              <p className="font-semibold text-[#1a2330]">{devis.chantier?.nom ?? '—'}</p>
              {devis.dateValidite && <p className="text-[#56606c]">Valable jusqu'au {formatDate(devis.dateValidite)}</p>}
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
              {lots.map((lot, i) => (
                <Fragment key={i}>
                  {lot.nom && (
                    <tr key={`lot-${i}`}>
                      <td colSpan={5} className="pt-2 text-[10px] font-extrabold text-[#1b3a66]">
                        {lot.nom}
                      </td>
                    </tr>
                  )}
                  {lot.lignes.map((ligne) => (
                    <tr key={ligne.id} className="border-b border-[#eef0f3]">
                      <td className="py-1">{ligne.designation}</td>
                      <td className="py-1 text-right">{ligne.unite}</td>
                      <td className="py-1 text-right">{ligne.quantite}</td>
                      <td className="py-1 text-right">{formatMAD(ligne.prixUnitaire)}</td>
                      <td className="py-1 text-right">{formatMAD(Number(ligne.quantite) * Number(ligne.prixUnitaire))}</td>
                    </tr>
                  ))}
                  {lot.nom && (
                    <tr key={`subtotal-${i}`} className="border-b border-dashed border-[#d3d8de] text-[#6b7480]">
                      <td colSpan={4} className="py-1 italic">
                        Sous-total {lot.nom}
                      </td>
                      <td className="py-1 text-right italic">{formatMAD(sousTotal(lot.lignes))}</td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>

          <div className="mt-3 flex justify-end">
            <div className="w-64 rounded-md bg-[#f5f6f8] p-2.5 text-[9.6px]">
              <div className="flex justify-between">
                <span>Total HT</span>
                <span>{formatMAD(devis.totaux.montantHT)}</span>
              </div>
              <div className="flex justify-between">
                <span>TVA ({devis.tauxTva}%)</span>
                <span>{formatMAD(devis.totaux.montantTVA)}</span>
              </div>
              <div className="mt-1 flex justify-between border-t border-[#c7cdd6] pt-1 text-[11.5px] font-extrabold text-[#1b3a66]">
                <span>Total TTC</span>
                <span>{formatMAD(devis.totaux.montantTTC)}</span>
              </div>
            </div>
          </div>
          <p className="mt-1.5 text-right text-[9px] italic text-[#56606c]">
            Arrêté le présent devis à la somme de : {montantEnLettres(devis.totaux.montantNetAPayer)}.
          </p>

          {devis.conditions && (
            <div className="mt-4 text-[9.5px] text-[#3a4048]">
              <p className="mb-0.5 font-bold text-[#1a2330]">Conditions</p>
              <p className="whitespace-pre-wrap">{devis.conditions}</p>
            </div>
          )}

          <div className="mt-auto pt-4">
            {societe.rib && <p className="mb-2 text-[8.6px] text-[#7c8794]">RIB : {societe.rib}</p>}
            <div className="rounded-t bg-[#1b3a66] px-2 py-1 text-[7.6px] uppercase tracking-wide text-white">Validation</div>
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
