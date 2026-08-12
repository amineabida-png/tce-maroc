import { Navigate, Route, Routes } from 'react-router-dom';
import LoginPage from '@/features/auth/LoginPage';
import DashboardPage from '@/features/dashboard/DashboardPage';
import ClientsPage from '@/features/clients/ClientsPage';
import FournisseursPage from '@/features/fournisseurs/FournisseursPage';
import SousTraitantsPage from '@/features/sous-traitants/SousTraitantsPage';
import ChantiersPage from '@/features/chantiers/ChantiersPage';
import ChantierDetailPage from '@/features/chantiers/ChantierDetailPage';
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
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
