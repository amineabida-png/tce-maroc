-- CreateEnum
CREATE TYPE "tce_maroc"."StatutChantier" AS ENUM ('EN_PREPARATION', 'EN_COURS', 'EN_RETARD', 'SUSPENDU', 'TERMINE', 'ANNULE');

-- CreateEnum
CREATE TYPE "tce_maroc"."StatutTache" AS ENUM ('A_FAIRE', 'EN_COURS', 'TERMINEE', 'BLOQUEE');

-- CreateEnum
CREATE TYPE "tce_maroc"."CategorieDepense" AS ENUM ('MAIN_DOEUVRE', 'MATERIAUX', 'SOUS_TRAITANCE', 'LOCATION_MATERIEL', 'AUTRE');

-- CreateTable
CREATE TABLE "tce_maroc"."Chantier" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "clientId" TEXT,
    "adresse" TEXT,
    "ville" TEXT,
    "budgetPrevisionnel" DECIMAL(14,2),
    "dateDebut" TIMESTAMP(3),
    "dateFinPrevue" TIMESTAMP(3),
    "dateFinReelle" TIMESTAMP(3),
    "avancement" INTEGER NOT NULL DEFAULT 0,
    "statut" "tce_maroc"."StatutChantier" NOT NULL DEFAULT 'EN_PREPARATION',
    "conducteurId" TEXT,
    "description" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Chantier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tce_maroc"."TacheChantier" (
    "id" TEXT NOT NULL,
    "chantierId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "dateDebut" TIMESTAMP(3),
    "dateFin" TIMESTAMP(3),
    "avancement" INTEGER NOT NULL DEFAULT 0,
    "statut" "tce_maroc"."StatutTache" NOT NULL DEFAULT 'A_FAIRE',
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "predecesseurId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TacheChantier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tce_maroc"."DepenseChantier" (
    "id" TEXT NOT NULL,
    "chantierId" TEXT NOT NULL,
    "categorie" "tce_maroc"."CategorieDepense" NOT NULL,
    "montant" DECIMAL(14,2) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "fournisseurId" TEXT,
    "sousTraitantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DepenseChantier_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Chantier_nom_idx" ON "tce_maroc"."Chantier"("nom");

-- CreateIndex
CREATE INDEX "Chantier_statut_idx" ON "tce_maroc"."Chantier"("statut");

-- CreateIndex
CREATE INDEX "TacheChantier_chantierId_idx" ON "tce_maroc"."TacheChantier"("chantierId");

-- CreateIndex
CREATE INDEX "DepenseChantier_chantierId_idx" ON "tce_maroc"."DepenseChantier"("chantierId");

-- AddForeignKey
ALTER TABLE "tce_maroc"."Chantier" ADD CONSTRAINT "Chantier_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "tce_maroc"."Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tce_maroc"."Chantier" ADD CONSTRAINT "Chantier_conducteurId_fkey" FOREIGN KEY ("conducteurId") REFERENCES "tce_maroc"."Utilisateur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tce_maroc"."TacheChantier" ADD CONSTRAINT "TacheChantier_chantierId_fkey" FOREIGN KEY ("chantierId") REFERENCES "tce_maroc"."Chantier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tce_maroc"."TacheChantier" ADD CONSTRAINT "TacheChantier_predecesseurId_fkey" FOREIGN KEY ("predecesseurId") REFERENCES "tce_maroc"."TacheChantier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tce_maroc"."DepenseChantier" ADD CONSTRAINT "DepenseChantier_chantierId_fkey" FOREIGN KEY ("chantierId") REFERENCES "tce_maroc"."Chantier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tce_maroc"."DepenseChantier" ADD CONSTRAINT "DepenseChantier_fournisseurId_fkey" FOREIGN KEY ("fournisseurId") REFERENCES "tce_maroc"."Fournisseur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tce_maroc"."DepenseChantier" ADD CONSTRAINT "DepenseChantier_sousTraitantId_fkey" FOREIGN KEY ("sousTraitantId") REFERENCES "tce_maroc"."SousTraitant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

