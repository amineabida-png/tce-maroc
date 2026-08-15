import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { DocumentPrintPage } from '@/components/print/DocumentPrintPage';
import { formatDate } from '@/lib/date';
import * as api from './api';

export default function BonLivraisonPrintPage() {
  const { id } = useParams<{ id: string }>();
  const { data: bl, isLoading } = useQuery({
    queryKey: ['bon-livraison', id],
    queryFn: () => api.fetchOne(id as string),
    enabled: Boolean(id),
  });

  if (isLoading || !bl) return <p className="text-muted-foreground">Chargement…</p>;

  return (
    <DocumentPrintPage title="BON DE LIVRAISON" numero={bl.numero} date={formatDate(bl.date)}>
      {() => (
        <>
          {bl.commande && (
            <div className="mb-3 rounded-md bg-[#eef3f0] px-3 py-1.5 text-[9px] text-[#2f6d4f]">
              Établi à partir du bon de commande <b>{bl.commande.numero}</b>.
            </div>
          )}

          <div className="mb-4 grid grid-cols-2 gap-3 text-[10.5px]">
            <div className="rounded-md bg-[#f5f6f8] p-2.5">
              <p className="text-[7.8px] font-bold uppercase tracking-wide text-[#2f6d4f]">Livré à</p>
              <p className="font-semibold text-[#1a2330]">{bl.client.nom}</p>
              {bl.client.adresse && <p className="text-[#56606c]">{bl.client.adresse}</p>}
            </div>
            <div className="rounded-md bg-[#f5f6f8] p-2.5">
              <p className="text-[7.8px] font-bold uppercase tracking-wide text-[#2f6d4f]">Lieu de livraison</p>
              <p className="font-semibold text-[#1a2330]">{bl.lieuLivraison || bl.chantier?.nom || '—'}</p>
              {bl.chantier && bl.lieuLivraison && <p className="text-[#56606c]">Chantier {bl.chantier.nom}</p>}
            </div>
          </div>

          <table className="w-full border-collapse text-[9.6px]">
            <thead>
              <tr className="border-b-2 border-[#1a2330] text-left text-[8px] uppercase text-[#45505c]">
                <th className="py-1">Désignation</th>
                <th className="py-1 pr-3 text-right">Unité</th>
                <th className="py-1 pr-3 text-right">Qté commandée</th>
                <th className="py-1 pr-3 text-right">Qté livrée</th>
                <th className="py-1 pl-3">Observations</th>
              </tr>
            </thead>
            <tbody>
              {bl.lignes.map((ligne) => (
                <tr key={ligne.id} className="border-b border-[#eef0f3]">
                  <td className="py-1">{ligne.designation}</td>
                  <td className="py-1 pr-3 text-right">{ligne.unite}</td>
                  <td className="py-1 pr-3 text-right">{ligne.quantiteCommandee ?? '—'}</td>
                  <td className="py-1 pr-3 text-right font-bold text-[#2f6d4f]">{ligne.quantiteLivree}</td>
                  <td className="py-1 pl-3 text-[#56606c]">{ligne.observations || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-[8.6px] italic text-[#8a93a0]">
            Aucun prix ni TVA sur ce document — la valorisation reste portée par la commande associée.
          </p>
          {bl.notes && (
            <div className="mt-4 text-[9.5px] text-[#3a4048]">
              <p className="mb-0.5 font-bold text-[#1a2330]">Notes</p>
              <p className="whitespace-pre-wrap">{bl.notes}</p>
            </div>
          )}

          <div className="mt-auto grid grid-cols-2 gap-3 pt-6">
            <div className="text-[8.5px] text-[#56606c]">
              <b className="mb-1 block text-[9px] text-[#1a2330]">Reçu par (client / chantier)</b>
              Nom, date et signature
              <div className="mt-1 h-12 rounded-md border border-[#c7cdd6]" />
            </div>
            <div className="text-[8.5px] text-[#56606c]">
              <b className="mb-1 block text-[9px] text-[#1a2330]">Livré par</b>
              Nom du chauffeur / référence transport
              <div className="mt-1 h-12 rounded-md border border-[#c7cdd6]" />
            </div>
          </div>
        </>
      )}
    </DocumentPrintPage>
  );
}
