import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CoutMainDoeuvreTab } from './CoutMainDoeuvreTab';
import { EmployesTab } from './EmployesTab';
import { FeuilleDePointageTab } from './FeuilleDePointageTab';

export default function RHPage() {
  const [tab, setTab] = useState('employes');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Ressources humaines</h1>
        <p className="text-muted-foreground">Fiches employés, pointage journalier et coût de main-d'œuvre par chantier.</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="employes">Employés</TabsTrigger>
          <TabsTrigger value="pointage">Feuille de pointage</TabsTrigger>
          <TabsTrigger value="cout">Coût main-d'œuvre</TabsTrigger>
        </TabsList>

        <TabsContent value="employes" className="mt-4">
          <EmployesTab />
        </TabsContent>
        <TabsContent value="pointage" className="mt-4">
          <FeuilleDePointageTab />
        </TabsContent>
        <TabsContent value="cout" className="mt-4">
          <CoutMainDoeuvreTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
