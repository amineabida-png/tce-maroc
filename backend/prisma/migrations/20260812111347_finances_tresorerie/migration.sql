-- CreateEnum
CREATE TYPE "tce_maroc"."TypeCompteTresorerie" AS ENUM ('BANQUE', 'CAISSE');

-- CreateEnum
CREATE TYPE "tce_maroc"."SensMouvement" AS ENUM ('ENCAISSEMENT', 'DECAISSEMENT');

-- CreateEnum
CREATE TYPE "tce_maroc"."StatutMouvement" AS ENUM ('PREVU', 'REALISE');

-- CreateEnum
CREATE TYPE "tce_maroc"."ModePaiementTresorerie" AS ENUM ('ESPECES', 'CHEQUE', 'VIREMENT', 'EFFET', 'AUTRE');

-- AlterTable
ALTER TABLE "tce_maroc"."Paiement" ADD COLUMN     "compteId" TEXT;

-- CreateTable
CREATE TABLE "tce_maroc"."CompteTresorerie" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "type" "tce_maroc"."TypeCompteTresorerie" NOT NULL DEFAULT 'BANQUE',
    "banque" TEXT,
    "rib" TEXT,
    "soldeInitial" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompteTresorerie_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tce_maroc"."MouvementTresorerie" (
    "id" TEXT NOT NULL,
    "compteId" TEXT NOT NULL,
    "sens" "tce_maroc"."SensMouvement" NOT NULL,
    "statut" "tce_maroc"."StatutMouvement" NOT NULL DEFAULT 'REALISE',
    "montant" DECIMAL(14,2) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "modePaiement" "tce_maroc"."ModePaiementTresorerie" NOT NULL DEFAULT 'VIREMENT',
    "reference" TEXT,
    "description" TEXT,
    "chantierId" TEXT,
    "fournisseurId" TEXT,
    "sousTraitantId" TEXT,
    "rapproche" BOOLEAN NOT NULL DEFAULT false,
    "dateRapprochement" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MouvementTresorerie_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CompteTresorerie_nom_idx" ON "tce_maroc"."CompteTresorerie"("nom");

-- CreateIndex
CREATE INDEX "MouvementTresorerie_compteId_idx" ON "tce_maroc"."MouvementTresorerie"("compteId");

-- CreateIndex
CREATE INDEX "MouvementTresorerie_date_idx" ON "tce_maroc"."MouvementTresorerie"("date");

-- CreateIndex
CREATE INDEX "MouvementTresorerie_statut_idx" ON "tce_maroc"."MouvementTresorerie"("statut");

-- CreateIndex
CREATE INDEX "Paiement_compteId_idx" ON "tce_maroc"."Paiement"("compteId");

-- AddForeignKey
ALTER TABLE "tce_maroc"."Paiement" ADD CONSTRAINT "Paiement_compteId_fkey" FOREIGN KEY ("compteId") REFERENCES "tce_maroc"."CompteTresorerie"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tce_maroc"."MouvementTresorerie" ADD CONSTRAINT "MouvementTresorerie_compteId_fkey" FOREIGN KEY ("compteId") REFERENCES "tce_maroc"."CompteTresorerie"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tce_maroc"."MouvementTresorerie" ADD CONSTRAINT "MouvementTresorerie_chantierId_fkey" FOREIGN KEY ("chantierId") REFERENCES "tce_maroc"."Chantier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tce_maroc"."MouvementTresorerie" ADD CONSTRAINT "MouvementTresorerie_fournisseurId_fkey" FOREIGN KEY ("fournisseurId") REFERENCES "tce_maroc"."Fournisseur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tce_maroc"."MouvementTresorerie" ADD CONSTRAINT "MouvementTresorerie_sousTraitantId_fkey" FOREIGN KEY ("sousTraitantId") REFERENCES "tce_maroc"."SousTraitant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
