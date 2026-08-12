-- CreateEnum
CREATE TYPE "tce_maroc"."TypeEntiteDocument" AS ENUM ('CHANTIER', 'CLIENT', 'FOURNISSEUR', 'SOUS_TRAITANT', 'DEVIS', 'COMMANDE', 'FACTURE', 'COMMANDE_FOURNISSEUR');

-- CreateTable
CREATE TABLE "tce_maroc"."Document" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "typeMime" TEXT NOT NULL,
    "tailleOctets" INTEGER NOT NULL,
    "contenu" BYTEA NOT NULL,
    "entiteType" "tce_maroc"."TypeEntiteDocument" NOT NULL,
    "entiteId" TEXT NOT NULL,
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Document_entiteType_entiteId_idx" ON "tce_maroc"."Document"("entiteType", "entiteId");

-- AddForeignKey
ALTER TABLE "tce_maroc"."Document" ADD CONSTRAINT "Document_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "tce_maroc"."Utilisateur"("id") ON DELETE SET NULL ON UPDATE CASCADE;
