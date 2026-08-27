/*
  Warnings:

  - You are about to drop the column `createdById` on the `brs` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "brs" DROP CONSTRAINT "brs_createdById_fkey";

-- AlterTable
ALTER TABLE "brs" DROP COLUMN "createdById";

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "passwordHash" DROP NOT NULL;
