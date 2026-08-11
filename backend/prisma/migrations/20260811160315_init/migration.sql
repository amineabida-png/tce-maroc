-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "tce_maroc";

-- CreateEnum
CREATE TYPE "tce_maroc"."Role" AS ENUM ('ADMIN', 'DIRECTEUR', 'CONDUCTEUR_TRAVAUX', 'COMPTABLE', 'MAGASINIER', 'COMMERCIAL');

-- CreateTable
CREATE TABLE "tce_maroc"."Utilisateur" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "motDePasse" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "role" "tce_maroc"."Role" NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Utilisateur_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tce_maroc"."RefreshToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "utilisateurId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tce_maroc"."Societe" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "formeJuridique" TEXT,
    "adresse" TEXT,
    "ville" TEXT,
    "telephone" TEXT,
    "email" TEXT,
    "logo" TEXT,
    "ice" TEXT,
    "rc" TEXT,
    "identifiantFiscal" TEXT,
    "patente" TEXT,
    "cnss" TEXT,
    "rib" TEXT,
    "tauxTvaDefaut" DECIMAL(5,2) NOT NULL DEFAULT 20,
    "tauxRetenueGarantie" DECIMAL(5,2) NOT NULL DEFAULT 10,
    "tauxRetenueSource" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Societe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tce_maroc"."Numerotation" (
    "id" TEXT NOT NULL,
    "societeId" TEXT NOT NULL,
    "typeDocument" TEXT NOT NULL,
    "prefixe" TEXT NOT NULL,
    "anneeCourante" INTEGER NOT NULL,
    "dernierNumero" INTEGER NOT NULL DEFAULT 0,
    "resetAnnuel" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Numerotation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tce_maroc"."JournalAudit" (
    "id" TEXT NOT NULL,
    "utilisateurId" TEXT,
    "action" TEXT NOT NULL,
    "entite" TEXT,
    "entiteId" TEXT,
    "metadonnees" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JournalAudit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Utilisateur_email_key" ON "tce_maroc"."Utilisateur"("email");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_token_key" ON "tce_maroc"."RefreshToken"("token");

-- CreateIndex
CREATE INDEX "RefreshToken_utilisateurId_idx" ON "tce_maroc"."RefreshToken"("utilisateurId");

-- CreateIndex
CREATE UNIQUE INDEX "Numerotation_societeId_typeDocument_key" ON "tce_maroc"."Numerotation"("societeId", "typeDocument");

-- CreateIndex
CREATE INDEX "JournalAudit_utilisateurId_idx" ON "tce_maroc"."JournalAudit"("utilisateurId");

-- CreateIndex
CREATE INDEX "JournalAudit_entite_entiteId_idx" ON "tce_maroc"."JournalAudit"("entite", "entiteId");

-- AddForeignKey
ALTER TABLE "tce_maroc"."RefreshToken" ADD CONSTRAINT "RefreshToken_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "tce_maroc"."Utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tce_maroc"."Numerotation" ADD CONSTRAINT "Numerotation_societeId_fkey" FOREIGN KEY ("societeId") REFERENCES "tce_maroc"."Societe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tce_maroc"."JournalAudit" ADD CONSTRAINT "JournalAudit_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "tce_maroc"."Utilisateur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

