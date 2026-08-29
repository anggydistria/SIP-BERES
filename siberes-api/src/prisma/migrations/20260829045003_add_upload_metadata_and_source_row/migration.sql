/*
  Warnings:

  - You are about to alter the column `size` on the `data_uploads` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - A unique constraint covering the columns `[dataUploadId,sourceRow]` on the table `raw_data` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `sourceRow` to the `raw_data` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "data_uploads" ADD COLUMN     "errorMessage" TEXT,
ADD COLUMN     "processedAt" TIMESTAMP(3),
ADD COLUMN     "rowCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "sheetName" TEXT,
ALTER COLUMN "size" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "raw_data" ADD COLUMN     "sourceRow" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "raw_data_dataUploadId_sourceRow_key" ON "raw_data"("dataUploadId", "sourceRow");
