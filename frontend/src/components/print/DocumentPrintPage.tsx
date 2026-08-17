import { useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Printer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { SelectNative } from '@/components/ui/select-native';
import * as societeApi from '@/features/societe/api';

type PositionCachet = 'bas-droite' | 'bas-gauche' | 'centre';

const POSITION_LABELS: Record<PositionCachet, string> = {
  'bas-droite': 'Bas droite',
  'bas-gauche': 'Bas gauche',
  centre: 'Centré',
};

export interface CachetRenderProps {
  /** null si le cachet est masqué ou non configuré — ne rien afficher dans ce cas. */
  element: ReactNode | null;
}

interface DocumentPrintPageProps {
  title: string;
  numero: string;
  date: string;
  children: (cachet: CachetRenderProps) => ReactNode;
}

// Mise en page A4 partagée (option "Chantier BTP") : bandeau couleur,
// pastille titre, en-tête togglable, cachet togglable (taille/position). Le
// contenu (parties, tableau, totaux, bande de signature) reste au document
// appelant via `children`, qui reçoit l'élément cachet à placer où il veut
// dans sa propre bande de signature.
export function DocumentPrintPage({ title, numero, date, children }: DocumentPrintPageProps) {
  const navigate = useNavigate();
  const [showEntete, setShowEntete] = useState(true);
  const [showCachet, setShowCachet] = useState(false);
  const [cachetTaille, setCachetTaille] = useState(90);
  const [cachetPosition, setCachetPosition] = useState<PositionCachet>('bas-droite');

  const { data: societe } = useQuery({
    queryKey: ['societe'],
    queryFn: () => societeApi.fetchSociete(),
  });

  if (!societe) return <p className="text-muted-foreground">Chargement…</p>;

  const cachetElement =
    showCachet && societe.cachet ? (
      <img
        src={societe.cachet}
        alt="Cachet"
        className="pointer-events-none opacity-90"
        style={{ width: cachetTaille, transform: cachetPosition === 'centre' ? undefined : 'rotate(-4deg)' }}
      />
    ) : null;

  return (
    <div className="space-y-4">
      <div className="no-print flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-3">
        <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Button>
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input type="checkbox" checked={showEntete} onChange={(e) => setShowEntete(e.target.checked)} />
            Afficher l'en-tête
          </label>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input type="checkbox" checked={showCachet} onChange={(e) => setShowCachet(e.target.checked)} disabled={!societe.cachet} />
            Afficher le cachet
          </label>
          {showCachet && societe.cachet && (
            <>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Taille</span>
                <input type="range" min={60} max={160} step={10} value={cachetTaille} onChange={(e) => setCachetTaille(Number(e.target.value))} className="w-24" />
              </div>
              <SelectNative className="w-36" value={cachetPosition} onChange={(e) => setCachetPosition(e.target.value as PositionCachet)}>
                {(Object.keys(POSITION_LABELS) as PositionCachet[]).map((p) => (
                  <option key={p} value={p}>
                    {POSITION_LABELS[p]}
                  </option>
                ))}
              </SelectNative>
            </>
          )}
          {showCachet && !societe.cachet && <span className="text-sm text-muted-foreground">Aucun cachet importé — Paramètres société.</span>}
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => window.print()}>
          <Printer className="h-4 w-4" />
          Imprimer
        </Button>
      </div>

      <div className="overflow-x-auto bg-muted/30 p-6 print:overflow-visible print:bg-transparent print:p-0">
        <div className="print-sheet relative mx-auto flex min-h-[297mm] w-[210mm] max-w-none shrink-0 flex-col bg-white text-black shadow-lg">
          {showEntete ? (
            <>
              <div className="h-[6px] bg-gradient-to-r from-[#1b3a66] to-[#c2691f]" />
              <div className="flex items-start justify-between px-[8%] pt-6">
                <div className="flex items-center gap-3">
                  {societe.logo ? (
                    <img src={societe.logo} alt={societe.nom} className="h-[38px] w-[38px] object-contain" />
                  ) : (
                    <div className="flex h-[38px] w-[38px] items-center justify-center rounded-lg bg-[#1b3a66] text-[13px] font-extrabold text-white">
                      {societe.nom.slice(0, 3).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-[15px] font-extrabold leading-tight text-[#1a2330]">{societe.nom}</p>
                    <p className="text-[9px] text-[#7c8794]">
                      {[societe.ice && `ICE ${societe.ice}`, societe.rc && `RC ${societe.rc}`, societe.identifiantFiscal && `IF ${societe.identifiantFiscal}`, societe.patente && `Patente ${societe.patente}`]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                    <p className="text-[9px] text-[#7c8794]">{[societe.adresse, societe.ville, societe.telephone].filter(Boolean).join(' · ')}</p>
                  </div>
                </div>
                <div className="rounded-full bg-[#c2691f] px-4 py-2 text-right text-[13px] font-extrabold tracking-wide text-white">
                  {title}
                  <span className="block text-[10px] font-semibold opacity-90">
                    {numero} · {date}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="flex justify-end px-[8%] pt-8">
              <div className="rounded-full bg-[#c2691f] px-4 py-2 text-right text-[13px] font-extrabold tracking-wide text-white">
                {title}
                <span className="block text-[10px] font-semibold opacity-90">
                  {numero} · {date}
                </span>
              </div>
            </div>
          )}
          <div className="flex flex-1 flex-col px-[8%] pb-[8%] pt-5">{children({ element: cachetElement })}</div>
        </div>
      </div>
    </div>
  );
}
