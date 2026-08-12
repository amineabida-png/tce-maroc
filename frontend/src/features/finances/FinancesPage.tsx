import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ComptesTab } from './ComptesTab';
import { EcheancierTab } from './EcheancierTab';
import { JournalTab } from './JournalTab';
import { MouvementsTab } from './MouvementsTab';

export default function FinancesPage() {
  const [tab, setTab] = useState('comptes');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Finances & trésorerie</h1>
        <p className="text-muted-foreground">Comptes, encaissements/décaissements, rapprochement bancaire et échéancier.</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="comptes">Comptes</TabsTrigger>
          <TabsTrigger value="mouvements">Mouvements</TabsTrigger>
          <TabsTrigger value="journal">Journal & rapprochement</TabsTrigger>
          <TabsTrigger value="echeancier">Échéancier</TabsTrigger>
        </TabsList>

        <TabsContent value="comptes" className="mt-4">
          <ComptesTab />
        </TabsContent>
        <TabsContent value="mouvements" className="mt-4">
          <MouvementsTab />
        </TabsContent>
        <TabsContent value="journal" className="mt-4">
          <JournalTab />
        </TabsContent>
        <TabsContent value="echeancier" className="mt-4">
          <EcheancierTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
