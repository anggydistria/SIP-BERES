-- CreateEnum
CREATE TYPE "BrsReviewDecision" AS ENUM ('APPROVED', 'REJECTED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "BrsStatus" ADD VALUE 'DRAFT_READY';
ALTER TYPE "BrsStatus" ADD VALUE 'FINAL_SUBMITTED';
ALTER TYPE "BrsStatus" ADD VALUE 'FINAL_REJECTED';

-- CreateTable
CREATE TABLE "brs_final_submissions" (
    "id" SERIAL NOT NULL,
    "brsId" INTEGER NOT NULL,
    "submittedById" INTEGER NOT NULL,
    "originalName" TEXT NOT NULL,
    "temporaryName" TEXT NOT NULL,
    "temporaryPath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "proposedNomorBrs" TEXT NOT NULL,
    "proposedTanggalPublikasi" DATE,
    "version" INTEGER NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "brs_final_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brs_review_histories" (
    "id" SERIAL NOT NULL,
    "brsId" INTEGER NOT NULL,
    "submittedById" INTEGER NOT NULL,
    "reviewedById" INTEGER NOT NULL,
    "submissionVersion" INTEGER NOT NULL,
    "originalName" TEXT NOT NULL,
    "proposedNomorBrs" TEXT NOT NULL,
    "proposedTanggalPublikasi" DATE,
    "decision" "BrsReviewDecision" NOT NULL,
    "note" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL,
    "reviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "brs_review_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brs_final_files" (
    "id" SERIAL NOT NULL,
    "brsId" INTEGER NOT NULL,
    "approvedById" INTEGER NOT NULL,
    "originalName" TEXT NOT NULL,
    "storedName" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "approvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "brs_final_files_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "brs_final_submissions_brsId_key" ON "brs_final_submissions"("brsId");

-- CreateIndex
CREATE INDEX "brs_final_submissions_submittedById_idx" ON "brs_final_submissions"("submittedById");

-- CreateIndex
CREATE UNIQUE INDEX "brs_final_files_brsId_key" ON "brs_final_files"("brsId");

-- CreateIndex
CREATE INDEX "brs_final_files_approvedById_idx" ON "brs_final_files"("approvedById");

-- AddForeignKey
ALTER TABLE "brs_final_submissions" ADD CONSTRAINT "brs_final_submissions_brsId_fkey" FOREIGN KEY ("brsId") REFERENCES "brs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brs_final_submissions" ADD CONSTRAINT "brs_final_submissions_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brs_review_histories" ADD CONSTRAINT "brs_review_histories_brsId_fkey" FOREIGN KEY ("brsId") REFERENCES "brs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brs_review_histories" ADD CONSTRAINT "brs_review_histories_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brs_review_histories" ADD CONSTRAINT "brs_review_histories_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brs_final_files" ADD CONSTRAINT "brs_final_files_brsId_fkey" FOREIGN KEY ("brsId") REFERENCES "brs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brs_final_files" ADD CONSTRAINT "brs_final_files_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
