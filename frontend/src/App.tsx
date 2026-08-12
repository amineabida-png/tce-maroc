import { Navigate, Route, Routes } from 'react-router-dom';
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
import CommandesPage from '@/features/commandes/CommandesPage';
import CommandeDetailPage from '@/features/commandes/CommandeDetailPage';
import FacturesPage from '@/features/factures/FacturesPage';
import FactureDetailPage from '@/features/factures/FactureDetailPage';
import ArticlesPage from '@/features/articles/ArticlesPage';
import CommandesFournisseurPage from '@/features/commandes-fournisseur/CommandesFournisseurPage';
import CommandeFournisseurDetailPage from '@/features/commandes-fournisseur/CommandeFournisseurDetailPage';
import StockPage from '@/features/stock/StockPage';
import ProtectedLayout from '@/layouts/ProtectedLayout';

export default function App() {
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
        <Route path="/commandes" element={<CommandesPage />} />
        <Route path="/commandes/:id" element={<CommandeDetailPage />} />
        <Route path="/factures" element={<FacturesPage />} />
        <Route path="/factures/:id" element={<FactureDetailPage />} />
        <Route path="/articles" element={<ArticlesPage />} />
        <Route path="/commandes-fournisseur" element={<CommandesFournisseurPage />} />
        <Route path="/commandes-fournisseur/:id" element={<CommandeFournisseurDetailPage />} />
        <Route path="/stock" element={<StockPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
