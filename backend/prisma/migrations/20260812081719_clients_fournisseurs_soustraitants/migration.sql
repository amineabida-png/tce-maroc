-- CreateEnum
CREATE TYPE "tce_maroc"."TypeClient" AS ENUM ('PARTICULIER', 'ENTREPRISE', 'MAITRE_OUVRAGE_PUBLIC');

-- CreateTable
CREATE TABLE "tce_maroc"."Client" (
    "id" TEXT NOT NULL,
    "type" "tce_maroc"."TypeClient" NOT NULL DEFAULT 'ENTREPRISE',
    "nom" TEXT NOT NULL,
    "contactNom" TEXT,
    "ice" TEXT,
    "rc" TEXT,
    "identifiantFiscal" TEXT,
    "adresse" TEXT,
    "ville" TEXT,
    "telephone" TEXT,
    "email" TEXT,
    "notes" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tce_maroc"."Fournisseur" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "categorie" TEXT,
    "contactNom" TEXT,
    "ice" TEXT,
    "rc" TEXT,
    "identifiantFiscal" TEXT,
    "adresse" TEXT,
    "ville" TEXT,
    "telephone" TEXT,
    "email" TEXT,
    "evaluation" INTEGER,
    "notes" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Fournisseur_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tce_maroc"."SousTraitant" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "corpsDetat" TEXT,
    "contactNom" TEXT,
    "ice" TEXT,
    "rc" TEXT,
    "identifiantFiscal" TEXT,
    "adresse" TEXT,
    "ville" TEXT,
    "telephone" TEXT,
    "email" TEXT,
    "evaluation" INTEGER,
    "notes" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SousTraitant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Client_nom_idx" ON "tce_maroc"."Client"("nom");

-- CreateIndex
CREATE INDEX "Fournisseur_nom_idx" ON "tce_maroc"."Fournisseur"("nom");

-- CreateIndex
CREATE INDEX "SousTraitant_nom_idx" ON "tce_maroc"."SousTraitant"("nom");
