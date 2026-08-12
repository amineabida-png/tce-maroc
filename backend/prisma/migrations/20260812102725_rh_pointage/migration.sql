-- CreateEnum
CREATE TYPE "tce_maroc"."TypeContrat" AS ENUM ('CDI', 'CDD', 'JOURNALIER', 'AUTRE');

-- CreateEnum
CREATE TYPE "tce_maroc"."StatutPointage" AS ENUM ('PRESENT', 'ABSENT', 'CONGE', 'MALADIE', 'JOUR_FERIE');

-- CreateTable
CREATE TABLE "tce_maroc"."Employe" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "cin" TEXT,
    "cnss" TEXT,
    "poste" TEXT,
    "typeContrat" "tce_maroc"."TypeContrat" NOT NULL DEFAULT 'CDI',
    "dateEmbauche" TIMESTAMP(3),
    "tauxHoraire" DECIMAL(10,2),
    "telephone" TEXT,
    "email" TEXT,
    "adresse" TEXT,
    "notes" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Employe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tce_maroc"."Pointage" (
    "id" TEXT NOT NULL,
    "employeId" TEXT NOT NULL,
    "chantierId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "statut" "tce_maroc"."StatutPointage" NOT NULL DEFAULT 'PRESENT',
    "nombreHeures" DECIMAL(5,2),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pointage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Employe_nom_idx" ON "tce_maroc"."Employe"("nom");

-- CreateIndex
CREATE INDEX "Pointage_chantierId_idx" ON "tce_maroc"."Pointage"("chantierId");

-- CreateIndex
CREATE INDEX "Pointage_date_idx" ON "tce_maroc"."Pointage"("date");

-- CreateIndex
CREATE UNIQUE INDEX "Pointage_employeId_date_key" ON "tce_maroc"."Pointage"("employeId", "date");

-- AddForeignKey
ALTER TABLE "tce_maroc"."Pointage" ADD CONSTRAINT "Pointage_employeId_fkey" FOREIGN KEY ("employeId") REFERENCES "tce_maroc"."Employe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tce_maroc"."Pointage" ADD CONSTRAINT "Pointage_chantierId_fkey" FOREIGN KEY ("chantierId") REFERENCES "tce_maroc"."Chantier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

