-- CreateEnum
CREATE TYPE "tce_maroc"."StatutContratSousTraitant" AS ENUM ('BROUILLON', 'CONFIRME', 'TERMINE', 'ANNULE');

-- CreateEnum
CREATE TYPE "tce_maroc"."StatutSituation" AS ENUM ('BROUILLON', 'ENVOYEE', 'PAYEE', 'ANNULEE');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "tce_maroc"."TypeEntiteDocument" ADD VALUE 'SITUATION';
ALTER TYPE "tce_maroc"."TypeEntiteDocument" ADD VALUE 'CONTRAT_SOUS_TRAITANCE';

-- CreateTable
CREATE TABLE "tce_maroc"."ContratSousTraitant" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "sousTraitantId" TEXT NOT NULL,
    "chantierId" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "statut" "tce_maroc"."StatutContratSousTraitant" NOT NULL DEFAULT 'BROUILLON',
    "tauxTva" DECIMAL(5,2) NOT NULL DEFAULT 20,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContratSousTraitant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tce_maroc"."LigneContratSousTraitant" (
    "id" TEXT NOT NULL,
    "contratSousTraitantId" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "unite" TEXT NOT NULL,
    "quantite" DECIMAL(12,3) NOT NULL,
    "prixUnitaire" DECIMAL(12,2) NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "LigneContratSousTraitant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tce_maroc"."Situation" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "numeroSituation" INTEGER NOT NULL,
    "commandeId" TEXT,
    "contratSousTraitantId" TEXT,
    "chantierId" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "statut" "tce_maroc"."StatutSituation" NOT NULL DEFAULT 'BROUILLON',
    "tauxTva" DECIMAL(5,2) NOT NULL DEFAULT 20,
    "tauxRetenueGarantie" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Situation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tce_maroc"."LigneSituation" (
    "id" TEXT NOT NULL,
    "situationId" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "unite" TEXT NOT NULL,
    "quantiteMarche" DECIMAL(12,3) NOT NULL,
    "prixUnitaire" DECIMAL(12,2) NOT NULL,
    "avancementPrecedentPourcent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "avancementCumulePourcent" DECIMAL(5,2) NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "LigneSituation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ContratSousTraitant_numero_key" ON "tce_maroc"."ContratSousTraitant"("numero");

-- CreateIndex
CREATE INDEX "ContratSousTraitant_sousTraitantId_idx" ON "tce_maroc"."ContratSousTraitant"("sousTraitantId");

-- CreateIndex
CREATE INDEX "LigneContratSousTraitant_contratSousTraitantId_idx" ON "tce_maroc"."LigneContratSousTraitant"("contratSousTraitantId");

-- CreateIndex
CREATE UNIQUE INDEX "Situation_numero_key" ON "tce_maroc"."Situation"("numero");

-- CreateIndex
CREATE INDEX "Situation_commandeId_idx" ON "tce_maroc"."Situation"("commandeId");

-- CreateIndex
CREATE INDEX "Situation_contratSousTraitantId_idx" ON "tce_maroc"."Situation"("contratSousTraitantId");

-- CreateIndex
CREATE INDEX "LigneSituation_situationId_idx" ON "tce_maroc"."LigneSituation"("situationId");

-- AddForeignKey
ALTER TABLE "tce_maroc"."ContratSousTraitant" ADD CONSTRAINT "ContratSousTraitant_sousTraitantId_fkey" FOREIGN KEY ("sousTraitantId") REFERENCES "tce_maroc"."SousTraitant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tce_maroc"."ContratSousTraitant" ADD CONSTRAINT "ContratSousTraitant_chantierId_fkey" FOREIGN KEY ("chantierId") REFERENCES "tce_maroc"."Chantier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tce_maroc"."LigneContratSousTraitant" ADD CONSTRAINT "LigneContratSousTraitant_contratSousTraitantId_fkey" FOREIGN KEY ("contratSousTraitantId") REFERENCES "tce_maroc"."ContratSousTraitant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tce_maroc"."Situation" ADD CONSTRAINT "Situation_commandeId_fkey" FOREIGN KEY ("commandeId") REFERENCES "tce_maroc"."Commande"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tce_maroc"."Situation" ADD CONSTRAINT "Situation_contratSousTraitantId_fkey" FOREIGN KEY ("contratSousTraitantId") REFERENCES "tce_maroc"."ContratSousTraitant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tce_maroc"."Situation" ADD CONSTRAINT "Situation_chantierId_fkey" FOREIGN KEY ("chantierId") REFERENCES "tce_maroc"."Chantier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tce_maroc"."LigneSituation" ADD CONSTRAINT "LigneSituation_situationId_fkey" FOREIGN KEY ("situationId") REFERENCES "tce_maroc"."Situation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

