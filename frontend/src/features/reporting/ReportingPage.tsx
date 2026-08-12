import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CATab } from './CATab';
import { ImpayesTab } from './ImpayesTab';
import { MargeChantiersTab } from './MargeChantiersTab';
import { StockTab } from './StockTab';

export default function ReportingPage() {
  const [tab, setTab] = useState('ca');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Reporting</h1>
        <p className="text-muted-foreground">Chiffre d'affaires, marge par chantier, état du stock et créances clients.</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="ca">Chiffre d'affaires</TabsTrigger>
          <TabsTrigger value="marge">Marge par chantier</TabsTrigger>
          <TabsTrigger value="stock">État du stock</TabsTrigger>
          <TabsTrigger value="impayes">Créances clients</TabsTrigger>
        </TabsList>

        <TabsContent value="ca" className="mt-4">
          <CATab />
        </TabsContent>
        <TabsContent value="marge" className="mt-4">
          <MargeChantiersTab />
        </TabsContent>
        <TabsContent value="stock" className="mt-4">
          <StockTab />
        </TabsContent>
        <TabsContent value="impayes" className="mt-4">
          <ImpayesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
