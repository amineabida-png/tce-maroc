import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { applyUserTheme } from '@/lib/theme';
import { useAuthStore } from '@/store/auth';
import LoginPage from '@/features/auth/LoginPage';
import DashboardPage from '@/features/dashboard/DashboardPage';
import ClientsPage from '@/features/clients/ClientsPage';
import FournisseursPage from '@/features/fournisseurs/FournisseursPage';
import SousTraitantsPage from '@/features/sous-traitants/SousTraitantsPage';
import ChantiersPage from '@/features/chantiers/ChantiersPage';
import ChantierDetailPage from '@/features/chantiers/ChantierDetailPage';
import OuvragesPage from '@/features/ouvrages/OuvragesPage';
import DevisPage from '@/features/devis/DevisPage';
import DevisDetailPage from '@/features/devis/DevisDetailPage';
import DevisPrintPage from '@/features/devis/DevisPrintPage';
import CommandesPage from '@/features/commandes/CommandesPage';
import CommandeDetailPage from '@/features/commandes/CommandeDetailPage';
import CommandePrintPage from '@/features/commandes/CommandePrintPage';
import FacturesPage from '@/features/factures/FacturesPage';
import FactureDetailPage from '@/features/factures/FactureDetailPage';
import FacturePrintPage from '@/features/factures/FacturePrintPage';
import BonsLivraisonPage from '@/features/bons-livraison/BonsLivraisonPage';
import BonLivraisonDetailPage from '@/features/bons-livraison/BonLivraisonDetailPage';
import BonLivraisonPrintPage from '@/features/bons-livraison/BonLivraisonPrintPage';
import ArticlesPage from '@/features/articles/ArticlesPage';
import CommandesFournisseurPage from '@/features/commandes-fournisseur/CommandesFournisseurPage';
import CommandeFournisseurDetailPage from '@/features/commandes-fournisseur/CommandeFournisseurDetailPage';
import CommandeFournisseurPrintPage from '@/features/commandes-fournisseur/CommandeFournisseurPrintPage';
import StockPage from '@/features/stock/StockPage';
import RHPage from '@/features/rh/RHPage';
import FinancesPage from '@/features/finances/FinancesPage';
import ReportingPage from '@/features/reporting/ReportingPage';
import AdministrationPage from '@/features/administration/AdministrationPage';
import SocietePage from '@/features/societe/SocietePage';
import ProtectedLayout from '@/layouts/ProtectedLayout';

export default function App() {
  const couleurPrimaire = useAuthStore((s) => s.user?.couleurPrimaire);
  const couleurAccent = useAuthStore((s) => s.user?.couleurAccent);

  useEffect(() => {
    applyUserTheme(couleurPrimaire, couleurAccent);
  }, [couleurPrimaire, couleurAccent]);

  return (
    <Routes>
      <Route path="/connexion" element={<LoginPage />} />
      <Route element={<ProtectedLayout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/clients" element={<ClientsPage />} />
        <Route path="/fournisseurs" element={<FournisseursPage />} />
        <Route path="/sous-traitants" element={<SousTraitantsPage />} />
        <Route path="/chantiers" element={<ChantiersPage />} />
        <Route path="/chantiers/:id" element={<ChantierDetailPage />} />
        <Route path="/ouvrages" element={<OuvragesPage />} />
        <Route path="/devis" element={<DevisPage />} />
        <Route path="/devis/:id" element={<DevisDetailPage />} />
        <Route path="/devis/:id/imprimer" element={<DevisPrintPage />} />
        <Route path="/commandes" element={<CommandesPage />} />
        <Route path="/commandes/:id" element={<CommandeDetailPage />} />
        <Route path="/commandes/:id/imprimer" element={<CommandePrintPage />} />
        <Route path="/factures" element={<FacturesPage />} />
        <Route path="/factures/:id" element={<FactureDetailPage />} />
        <Route path="/factures/:id/imprimer" element={<FacturePrintPage />} />
        <Route path="/bons-livraison" element={<BonsLivraisonPage />} />
        <Route path="/bons-livraison/:id" element={<BonLivraisonDetailPage />} />
        <Route path="/bons-livraison/:id/imprimer" element={<BonLivraisonPrintPage />} />
        <Route path="/articles" element={<ArticlesPage />} />
        <Route path="/commandes-fournisseur" element={<CommandesFournisseurPage />} />
        <Route path="/commandes-fournisseur/:id" element={<CommandeFournisseurDetailPage />} />
        <Route path="/commandes-fournisseur/:id/imprimer" element={<CommandeFournisseurPrintPage />} />
        <Route path="/stock" element={<StockPage />} />
        <Route path="/rh" element={<RHPage />} />
        <Route path="/finances" element={<FinancesPage />} />
        <Route path="/reporting" element={<ReportingPage />} />
        <Route path="/administration" element={<AdministrationPage />} />
        <Route path="/parametres" element={<SocietePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
