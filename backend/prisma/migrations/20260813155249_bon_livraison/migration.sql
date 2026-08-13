-- AlterEnum
ALTER TYPE "tce_maroc"."TypeEntiteDocument" ADD VALUE 'BON_LIVRAISON';

-- CreateTable
CREATE TABLE "tce_maroc"."BonLivraison" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "chantierId" TEXT,
    "commandeId" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lieuLivraison" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BonLivraison_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tce_maroc"."LigneBonLivraison" (
    "id" TEXT NOT NULL,
    "bonLivraisonId" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "unite" TEXT NOT NULL,
    "quantiteCommandee" DECIMAL(12,3),
    "quantiteLivree" DECIMAL(12,3) NOT NULL,
    "observations" TEXT,
    "ordre" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "LigneBonLivraison_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BonLivraison_numero_key" ON "tce_maroc"."BonLivraison"("numero");

-- CreateIndex
CREATE INDEX "BonLivraison_clientId_idx" ON "tce_maroc"."BonLivraison"("clientId");

-- CreateIndex
CREATE INDEX "BonLivraison_chantierId_idx" ON "tce_maroc"."BonLivraison"("chantierId");

-- CreateIndex
CREATE INDEX "LigneBonLivraison_bonLivraisonId_idx" ON "tce_maroc"."LigneBonLivraison"("bonLivraisonId");

-- AddForeignKey
ALTER TABLE "tce_maroc"."BonLivraison" ADD CONSTRAINT "BonLivraison_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "tce_maroc"."Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tce_maroc"."BonLivraison" ADD CONSTRAINT "BonLivraison_chantierId_fkey" FOREIGN KEY ("chantierId") REFERENCES "tce_maroc"."Chantier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tce_maroc"."BonLivraison" ADD CONSTRAINT "BonLivraison_commandeId_fkey" FOREIGN KEY ("commandeId") REFERENCES "tce_maroc"."Commande"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tce_maroc"."LigneBonLivraison" ADD CONSTRAINT "LigneBonLivraison_bonLivraisonId_fkey" FOREIGN KEY ("bonLivraisonId") REFERENCES "tce_maroc"."BonLivraison"("id") ON DELETE CASCADE ON UPDATE CASCADE;

