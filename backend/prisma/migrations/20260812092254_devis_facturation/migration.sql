-- CreateEnum
CREATE TYPE "tce_maroc"."StatutDevis" AS ENUM ('BROUILLON', 'ENVOYE', 'ACCEPTE', 'REFUSE', 'EXPIRE', 'CONVERTI');

-- CreateEnum
CREATE TYPE "tce_maroc"."StatutCommande" AS ENUM ('BROUILLON', 'CONFIRMEE', 'ANNULEE', 'FACTUREE');

-- CreateEnum
CREATE TYPE "tce_maroc"."TypeFacture" AS ENUM ('FACTURE', 'AVOIR');

-- CreateEnum
CREATE TYPE "tce_maroc"."StatutFacture" AS ENUM ('BROUILLON', 'ENVOYEE', 'PARTIELLEMENT_PAYEE', 'PAYEE', 'EN_RETARD', 'ANNULEE');

-- CreateTable
CREATE TABLE "tce_maroc"."Ouvrage" (
    "id" TEXT NOT NULL,
    "corpsDetat" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "unite" TEXT NOT NULL,
    "prixUnitaireDefaut" DECIMAL(12,2) NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ouvrage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tce_maroc"."Devis" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "chantierId" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateValidite" TIMESTAMP(3),
    "statut" "tce_maroc"."StatutDevis" NOT NULL DEFAULT 'BROUILLON',
    "tauxTva" DECIMAL(5,2) NOT NULL DEFAULT 20,
    "conditions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Devis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tce_maroc"."LotDevis" (
    "id" TEXT NOT NULL,
    "devisId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "LotDevis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tce_maroc"."LigneDevis" (
    "id" TEXT NOT NULL,
    "devisId" TEXT NOT NULL,
    "lotId" TEXT,
    "designation" TEXT NOT NULL,
    "unite" TEXT NOT NULL,
    "quantite" DECIMAL(12,3) NOT NULL,
    "prixUnitaire" DECIMAL(12,2) NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "LigneDevis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tce_maroc"."Commande" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "devisId" TEXT,
    "clientId" TEXT NOT NULL,
    "chantierId" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "statut" "tce_maroc"."StatutCommande" NOT NULL DEFAULT 'BROUILLON',
    "tauxTva" DECIMAL(5,2) NOT NULL DEFAULT 20,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Commande_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tce_maroc"."LigneCommande" (
    "id" TEXT NOT NULL,
    "commandeId" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "unite" TEXT NOT NULL,
    "quantite" DECIMAL(12,3) NOT NULL,
    "prixUnitaire" DECIMAL(12,2) NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "LigneCommande_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tce_maroc"."Facture" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "type" "tce_maroc"."TypeFacture" NOT NULL DEFAULT 'FACTURE',
    "devisId" TEXT,
    "commandeId" TEXT,
    "clientId" TEXT NOT NULL,
    "chantierId" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateEcheance" TIMESTAMP(3),
    "statut" "tce_maroc"."StatutFacture" NOT NULL DEFAULT 'BROUILLON',
    "tauxTva" DECIMAL(5,2) NOT NULL DEFAULT 20,
    "tauxRetenueGarantie" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Facture_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tce_maroc"."LigneFacture" (
    "id" TEXT NOT NULL,
    "factureId" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "unite" TEXT NOT NULL,
    "quantite" DECIMAL(12,3) NOT NULL,
    "prixUnitaire" DECIMAL(12,2) NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "LigneFacture_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tce_maroc"."Paiement" (
    "id" TEXT NOT NULL,
    "factureId" TEXT NOT NULL,
    "montant" DECIMAL(12,2) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "mode" TEXT,
    "reference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Paiement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Ouvrage_corpsDetat_idx" ON "tce_maroc"."Ouvrage"("corpsDetat");

-- CreateIndex
CREATE INDEX "Ouvrage_designation_idx" ON "tce_maroc"."Ouvrage"("designation");

-- CreateIndex
CREATE UNIQUE INDEX "Devis_numero_key" ON "tce_maroc"."Devis"("numero");

-- CreateIndex
CREATE INDEX "Devis_clientId_idx" ON "tce_maroc"."Devis"("clientId");

-- CreateIndex
CREATE INDEX "Devis_statut_idx" ON "tce_maroc"."Devis"("statut");

-- CreateIndex
CREATE INDEX "LigneDevis_devisId_idx" ON "tce_maroc"."LigneDevis"("devisId");

-- CreateIndex
CREATE UNIQUE INDEX "Commande_numero_key" ON "tce_maroc"."Commande"("numero");

-- CreateIndex
CREATE INDEX "Commande_clientId_idx" ON "tce_maroc"."Commande"("clientId");

-- CreateIndex
CREATE INDEX "LigneCommande_commandeId_idx" ON "tce_maroc"."LigneCommande"("commandeId");

-- CreateIndex
CREATE UNIQUE INDEX "Facture_numero_key" ON "tce_maroc"."Facture"("numero");

-- CreateIndex
CREATE INDEX "Facture_clientId_idx" ON "tce_maroc"."Facture"("clientId");

-- CreateIndex
CREATE INDEX "Facture_statut_idx" ON "tce_maroc"."Facture"("statut");

-- CreateIndex
CREATE INDEX "LigneFacture_factureId_idx" ON "tce_maroc"."LigneFacture"("factureId");

-- CreateIndex
CREATE INDEX "Paiement_factureId_idx" ON "tce_maroc"."Paiement"("factureId");

-- AddForeignKey
ALTER TABLE "tce_maroc"."Devis" ADD CONSTRAINT "Devis_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "tce_maroc"."Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tce_maroc"."Devis" ADD CONSTRAINT "Devis_chantierId_fkey" FOREIGN KEY ("chantierId") REFERENCES "tce_maroc"."Chantier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tce_maroc"."LotDevis" ADD CONSTRAINT "LotDevis_devisId_fkey" FOREIGN KEY ("devisId") REFERENCES "tce_maroc"."Devis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tce_maroc"."LigneDevis" ADD CONSTRAINT "LigneDevis_devisId_fkey" FOREIGN KEY ("devisId") REFERENCES "tce_maroc"."Devis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tce_maroc"."LigneDevis" ADD CONSTRAINT "LigneDevis_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "tce_maroc"."LotDevis"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tce_maroc"."Commande" ADD CONSTRAINT "Commande_devisId_fkey" FOREIGN KEY ("devisId") REFERENCES "tce_maroc"."Devis"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tce_maroc"."Commande" ADD CONSTRAINT "Commande_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "tce_maroc"."Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tce_maroc"."Commande" ADD CONSTRAINT "Commande_chantierId_fkey" FOREIGN KEY ("chantierId") REFERENCES "tce_maroc"."Chantier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tce_maroc"."LigneCommande" ADD CONSTRAINT "LigneCommande_commandeId_fkey" FOREIGN KEY ("commandeId") REFERENCES "tce_maroc"."Commande"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tce_maroc"."Facture" ADD CONSTRAINT "Facture_devisId_fkey" FOREIGN KEY ("devisId") REFERENCES "tce_maroc"."Devis"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tce_maroc"."Facture" ADD CONSTRAINT "Facture_commandeId_fkey" FOREIGN KEY ("commandeId") REFERENCES "tce_maroc"."Commande"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tce_maroc"."Facture" ADD CONSTRAINT "Facture_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "tce_maroc"."Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tce_maroc"."Facture" ADD CONSTRAINT "Facture_chantierId_fkey" FOREIGN KEY ("chantierId") REFERENCES "tce_maroc"."Chantier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tce_maroc"."LigneFacture" ADD CONSTRAINT "LigneFacture_factureId_fkey" FOREIGN KEY ("factureId") REFERENCES "tce_maroc"."Facture"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tce_maroc"."Paiement" ADD CONSTRAINT "Paiement_factureId_fkey" FOREIGN KEY ("factureId") REFERENCES "tce_maroc"."Facture"("id") ON DELETE CASCADE ON UPDATE CASCADE;

