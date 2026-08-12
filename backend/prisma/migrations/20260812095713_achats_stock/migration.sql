-- CreateEnum
CREATE TYPE "tce_maroc"."StatutCommandeFournisseur" AS ENUM ('BROUILLON', 'ENVOYEE', 'PARTIELLEMENT_RECUE', 'RECUE', 'ANNULEE');

-- CreateEnum
CREATE TYPE "tce_maroc"."TypeMouvementStock" AS ENUM ('ENTREE', 'SORTIE');

-- CreateTable
CREATE TABLE "tce_maroc"."Article" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "categorie" TEXT,
    "unite" TEXT NOT NULL,
    "seuilAlerte" DECIMAL(12,3),
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tce_maroc"."CommandeFournisseur" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "fournisseurId" TEXT NOT NULL,
    "chantierId" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "statut" "tce_maroc"."StatutCommandeFournisseur" NOT NULL DEFAULT 'BROUILLON',
    "tauxTva" DECIMAL(5,2) NOT NULL DEFAULT 20,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommandeFournisseur_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tce_maroc"."LigneCommandeFournisseur" (
    "id" TEXT NOT NULL,
    "commandeFournisseurId" TEXT NOT NULL,
    "articleId" TEXT,
    "designation" TEXT NOT NULL,
    "unite" TEXT NOT NULL,
    "quantiteCommandee" DECIMAL(12,3) NOT NULL,
    "quantiteRecue" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "prixUnitaire" DECIMAL(12,2) NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "LigneCommandeFournisseur_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tce_maroc"."MouvementStock" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "type" "tce_maroc"."TypeMouvementStock" NOT NULL,
    "quantite" DECIMAL(12,3) NOT NULL,
    "prixUnitaire" DECIMAL(12,2),
    "chantierId" TEXT,
    "commandeFournisseurId" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MouvementStock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Article_nom_idx" ON "tce_maroc"."Article"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "CommandeFournisseur_numero_key" ON "tce_maroc"."CommandeFournisseur"("numero");

-- CreateIndex
CREATE INDEX "CommandeFournisseur_fournisseurId_idx" ON "tce_maroc"."CommandeFournisseur"("fournisseurId");

-- CreateIndex
CREATE INDEX "CommandeFournisseur_statut_idx" ON "tce_maroc"."CommandeFournisseur"("statut");

-- CreateIndex
CREATE INDEX "LigneCommandeFournisseur_commandeFournisseurId_idx" ON "tce_maroc"."LigneCommandeFournisseur"("commandeFournisseurId");

-- CreateIndex
CREATE INDEX "MouvementStock_articleId_idx" ON "tce_maroc"."MouvementStock"("articleId");

-- CreateIndex
CREATE INDEX "MouvementStock_chantierId_idx" ON "tce_maroc"."MouvementStock"("chantierId");

-- AddForeignKey
ALTER TABLE "tce_maroc"."CommandeFournisseur" ADD CONSTRAINT "CommandeFournisseur_fournisseurId_fkey" FOREIGN KEY ("fournisseurId") REFERENCES "tce_maroc"."Fournisseur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tce_maroc"."CommandeFournisseur" ADD CONSTRAINT "CommandeFournisseur_chantierId_fkey" FOREIGN KEY ("chantierId") REFERENCES "tce_maroc"."Chantier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tce_maroc"."LigneCommandeFournisseur" ADD CONSTRAINT "LigneCommandeFournisseur_commandeFournisseurId_fkey" FOREIGN KEY ("commandeFournisseurId") REFERENCES "tce_maroc"."CommandeFournisseur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tce_maroc"."LigneCommandeFournisseur" ADD CONSTRAINT "LigneCommandeFournisseur_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "tce_maroc"."Article"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tce_maroc"."MouvementStock" ADD CONSTRAINT "MouvementStock_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "tce_maroc"."Article"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tce_maroc"."MouvementStock" ADD CONSTRAINT "MouvementStock_chantierId_fkey" FOREIGN KEY ("chantierId") REFERENCES "tce_maroc"."Chantier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tce_maroc"."MouvementStock" ADD CONSTRAINT "MouvementStock_commandeFournisseurId_fkey" FOREIGN KEY ("commandeFournisseurId") REFERENCES "tce_maroc"."CommandeFournisseur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

