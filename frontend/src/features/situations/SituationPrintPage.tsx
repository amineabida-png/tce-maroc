import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { DocumentPrintPage } from '@/components/print/DocumentPrintPage';
import { formatDate } from '@/lib/date';
import { formatMAD } from '@/lib/currency';
import { montantEnLettres } from '@/lib/numberToWords';
import * as api from './api';
import * as societeApi from '@/features/societe/api';

export default function SituationPrintPage() {
  const { id } = useParams<{ id: string }>();
  const { data: situation, isLoading } = useQuery({
    queryKey: ['situation', id],
    queryFn: () => api.fetchOne(id as string),
    enabled: Boolean(id),
  });
  const { data: societe } = useQuery({ queryKey: ['societe'], queryFn: () => societeApi.fetchSociete() });

  if (isLoading || !situation || !societe) return <p className="text-muted-foreground">Chargement…</p>;

  const marche = situation.commande
    ? { label: 'Maître d\'ouvrage', nom: situation.commande.client?.nom, ref: situation.commande.numero, ice: situation.commande.client?.ice, adresse: situation.commande.client?.adresse }
    : { label: 'Sous-traitant', nom: situation.contratSousTraitant?.sousTraitant?.nom, ref: situation.contratSousTraitant?.numero, ice: situation.contratSousTraitant?.sousTraitant?.ice, adresse: situation.contratSousTraitant?.sousTraitant?.adresse };

  return (
    <DocumentPrintPage title="SITUATION DE TRAVAUX" numero={situation.numero} date={formatDate(situation.date)}>
      {({ element: cachet, primary, accent }) => (
        <>
          <div className="mb-4 grid grid-cols-2 gap-3 text-[10.5px]">
            <div className="rounded-md bg-[#f5f6f8] p-2.5">
              <p className="text-[7.8px] font-bold uppercase tracking-wide" style={{ color: accent }}>{marche.label}</p>
              <p className="font-semibold text-[#1a2330]">{marche.nom ?? '—'}</p>
              {marche.ice && <p className="text-[#56606c]">ICE {marche.ice}</p>}
              {marche.adresse && <p className="text-[#56606c]">{marche.adresse}</p>}
            </div>
            <div className="rounded-md bg-[#f5f6f8] p-2.5">
              <p className="text-[7.8px] font-bold uppercase tracking-wide" style={{ color: accent }}>Marché / Chantier</p>
              <p className="font-semibold text-[#1a2330]">{marche.ref}</p>
              <p className="text-[#56606c]">{situation.chantier?.nom ?? '—'}</p>
              <p className="text-[#56606c]">Situation n° {situation.numeroSituation}</p>
            </div>
          </div>

          <table className="w-full border-collapse text-[9.2px]">
            <thead>
              <tr className="border-b-2 border-[#1a2330] text-left text-[7.6px] uppercase text-[#45505c]">
                <th className="py-1">Désignation</th>
                <th className="py-1 text-right">Qté marché</th>
                <th className="py-1 text-right">P.U. DH</th>
                <th className="py-1 text-right">Montant marché</th>
                <th className="py-1 text-right">Préc. %</th>
                <th className="py-1 text-right">Cumulé %</th>
                <th className="py-1 text-right">Situation DH</th>
              </tr>
            </thead>
            <tbody>
              {situation.lignes.map((ligne) => (
                <tr key={ligne.id} className="border-b border-[#eef0f3]">
                  <td className="py-1">{ligne.designation}</td>
                  <td className="py-1 text-right">
                    {ligne.quantiteMarche} {ligne.unite}
                  </td>
                  <td className="py-1 text-right">{formatMAD(ligne.prixUnitaire)}</td>
                  <td className="py-1 text-right">{formatMAD(ligne.montantMarche)}</td>
                  <td className="py-1 text-right">{ligne.avancementPrecedentPourcent}%</td>
                  <td className="py-1 text-right font-medium">{ligne.avancementCumulePourcent}%</td>
                  <td className="py-1 text-right font-medium">{formatMAD(ligne.montantSituation)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-3 flex justify-end">
            <div className="w-72 rounded-md bg-[#f5f6f8] p-2.5 text-[9.6px]">
              <div className="flex justify-between">
                <span>Total HT de la situation</span>
                <span>{formatMAD(situation.totaux.montantHT)}</span>
              </div>
              <div className="flex justify-between">
                <span>TVA ({situation.tauxTva}%)</span>
                <span>{formatMAD(situation.totaux.montantTVA)}</span>
              </div>
              <div className="flex justify-between">
                <span>Total TTC</span>
                <span>{formatMAD(situation.totaux.montantTTC)}</span>
              </div>
              <div className="flex justify-between" style={{ color: accent }}>
                <span>Retenue de garantie ({situation.tauxRetenueGarantie}%)</span>
                <span>−{formatMAD(situation.totaux.montantRetenueGarantie)}</span>
              </div>
              <div className="mt-1 flex justify-between border-t border-[#c7cdd6] pt-1 text-[11.5px] font-extrabold" style={{ color: primary }}>
                <span>Net à payer</span>
                <span>{formatMAD(situation.totaux.montantNetAPayer)}</span>
              </div>
            </div>
          </div>
          <p className="mt-1.5 text-right text-[9px] italic text-[#56606c]">
            Arrêté le présent décompte à la somme de : {montantEnLettres(situation.totaux.montantNetAPayer)}.
          </p>
          <p className="mt-1 text-right text-[8.5px] text-[#7c8794]">
            Retenue de garantie conservée jusqu'à la réception définitive des travaux.
          </p>

          <div className="mt-auto pt-4">
            <div className="rounded-t px-2 py-1 text-[7.6px] uppercase tracking-wide text-white" style={{ backgroundColor: primary }}>Validation</div>
            <div className="grid grid-cols-2 border border-[#c7cdd6]">
              <div className="relative border-r border-[#c7cdd6] p-2 text-[8px] text-[#56606c]">
                <b className="mb-0.5 block text-[8.6px] text-[#1a2330]">{societe.nom}</b>
                Cachet &amp; signature
                <div className="flex h-9 items-end justify-end">{cachet}</div>
              </div>
              <div className="p-2 text-[8px] text-[#56606c]">
                <b className="mb-0.5 block text-[8.6px] text-[#1a2330]">{marche.label} — Bon pour accord</b>
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
