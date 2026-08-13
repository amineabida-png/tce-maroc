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

const POSITION_CLASSES: Record<PositionCachet, string> = {
  'bas-droite': 'bottom-16 right-16',
  'bas-gauche': 'bottom-16 left-16',
  centre: 'bottom-16 left-1/2 -translate-x-1/2',
};

interface DocumentPrintPageProps {
  title: string;
  numero: string;
  children: ReactNode;
}

// Mise en page A4 partagée par tous les documents imprimables (devis,
// factures, bons de commande, bons de commande fournisseur) : en-tête
// société et cachet togglables à la demande de l'utilisateur, jamais
// affichés par défaut sur l'impression.
export function DocumentPrintPage({ title, numero, children }: DocumentPrintPageProps) {
  const navigate = useNavigate();
  const [showEntete, setShowEntete] = useState(true);
  const [showCachet, setShowCachet] = useState(false);
  const [cachetTaille, setCachetTaille] = useState(140);
  const [cachetPosition, setCachetPosition] = useState<PositionCachet>('bas-droite');

  const { data: societe } = useQuery({
    queryKey: ['societe'],
    queryFn: () => societeApi.fetchSociete(),
  });

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
            <input type="checkbox" checked={showCachet} onChange={(e) => setShowCachet(e.target.checked)} disabled={!societe?.cachet} />
            Afficher le cachet
          </label>
          {showCachet && societe?.cachet && (
            <>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Taille</span>
                <input
                  type="range"
                  min={80}
                  max={240}
                  step={10}
                  value={cachetTaille}
                  onChange={(e) => setCachetTaille(Number(e.target.value))}
                  className="w-24"
                />
              </div>
              <SelectNative
                className="w-36"
                value={cachetPosition}
                onChange={(e) => setCachetPosition(e.target.value as PositionCachet)}
              >
                {(Object.keys(POSITION_LABELS) as PositionCachet[]).map((p) => (
                  <option key={p} value={p}>
                    {POSITION_LABELS[p]}
                  </option>
                ))}
              </SelectNative>
            </>
          )}
          {showCachet && !societe?.cachet && (
            <span className="text-sm text-muted-foreground">
              Aucun cachet importé — Paramètres société → Cachet d'entreprise.
            </span>
          )}
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => window.print()}>
          <Printer className="h-4 w-4" />
          Imprimer
        </Button>
      </div>

      <div className="flex justify-center bg-muted/30 p-6 print:bg-transparent print:p-0">
        <div className="print-sheet relative min-h-[297mm] w-[210mm] bg-white p-[15mm] text-black shadow-lg">
          {showEntete && societe && (
            <div className="mb-8 flex items-start justify-between gap-6 border-b border-black/20 pb-4">
              <div className="flex items-center gap-4">
                {societe.logo && <img src={societe.logo} alt={societe.nom} className="h-16 w-16 object-contain" />}
                <div>
                  <p className="text-lg font-bold">{societe.nom}</p>
                  {societe.formeJuridique && <p className="text-xs text-black/70">{societe.formeJuridique}</p>}
                  {societe.adresse && <p className="text-xs text-black/70">{societe.adresse}</p>}
                  <p className="text-xs text-black/70">
                    {[societe.ville, societe.telephone, societe.email].filter(Boolean).join(' · ')}
                  </p>
                  <p className="text-[10px] text-black/60">
                    {[
                      societe.ice && `ICE ${societe.ice}`,
                      societe.rc && `RC ${societe.rc}`,
                      societe.identifiantFiscal && `IF ${societe.identifiantFiscal}`,
                      societe.patente && `Patente ${societe.patente}`,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-xl font-bold uppercase tracking-wide">{title}</p>
                <p className="text-sm text-black/70">N° {numero}</p>
              </div>
            </div>
          )}
          {!showEntete && (
            <div className="mb-8 text-right">
              <p className="text-xl font-bold uppercase tracking-wide">{title}</p>
              <p className="text-sm text-black/70">N° {numero}</p>
            </div>
          )}

          {children}

          {showCachet && societe?.cachet && (
            <img
              src={societe.cachet}
              alt="Cachet"
              className={`pointer-events-none absolute opacity-90 ${POSITION_CLASSES[cachetPosition]}`}
              style={{ width: cachetTaille }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
