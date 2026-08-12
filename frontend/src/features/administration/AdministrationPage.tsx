import { useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthStore } from '@/store/auth';
import { JournalAuditTab } from './JournalAuditTab';
import { UtilisateursTab } from './UtilisateursTab';

export default function AdministrationPage() {
  const role = useAuthStore((s) => s.user?.role);
  const [tab, setTab] = useState('utilisateurs');

  const autorise = role === 'ADMIN' || role === 'DIRECTEUR';

  if (!autorise) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-16 text-center">
        <ShieldAlert className="h-8 w-8 text-muted-foreground" />
        <div>
          <p className="font-medium">Accès réservé</p>
          <p className="text-sm text-muted-foreground">La gestion des utilisateurs et le journal d'audit sont réservés à l'encadrement.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Administration</h1>
        <p className="text-muted-foreground">Gestion des comptes utilisateurs et journal d'audit.</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="utilisateurs">Utilisateurs</TabsTrigger>
          <TabsTrigger value="journal">Journal d'audit</TabsTrigger>
        </TabsList>

        <TabsContent value="utilisateurs" className="mt-4">
          <UtilisateursTab />
        </TabsContent>
        <TabsContent value="journal" className="mt-4">
          <JournalAuditTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
