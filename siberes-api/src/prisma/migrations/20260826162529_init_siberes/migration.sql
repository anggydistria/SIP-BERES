-- CreateEnum
CREATE TYPE "BrsStatus" AS ENUM ('DRAFT', 'FINAL');

-- CreateEnum
CREATE TYPE "UploadStatus" AS ENUM ('PROCESSING', 'ACTIVE', 'SUPERSEDED', 'FAILED');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('DRAFT', 'FINAL', 'REVISION');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "roleId" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brs" (
    "id" SERIAL NOT NULL,
    "jenisBrs" TEXT NOT NULL DEFAULT 'PARIWISATA',
    "bulan" INTEGER NOT NULL,
    "tahun" INTEGER NOT NULL,
    "nomorBrs" TEXT,
    "tanggalPublikasi" DATE,
    "status" "BrsStatus" NOT NULL DEFAULT 'DRAFT',
    "createdById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_uploads" (
    "id" SERIAL NOT NULL,
    "brsId" INTEGER NOT NULL,
    "uploadedById" INTEGER NOT NULL,
    "originalName" TEXT NOT NULL,
    "storedName" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "mimeType" TEXT,
    "size" BIGINT,
    "version" INTEGER NOT NULL,
    "status" "UploadStatus" NOT NULL DEFAULT 'PROCESSING',
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "data_uploads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "raw_data" (
    "id" SERIAL NOT NULL,
    "dataUploadId" INTEGER NOT NULL,
    "jenisAkomodasi" INTEGER NOT NULL,
    "kelasAkomodasi" INTEGER NOT NULL,
    "mktj" DECIMAL(18,4) NOT NULL,
    "mkts" DECIMAL(18,4) NOT NULL,
    "mta" DECIMAL(18,4) NOT NULL,
    "ta" DECIMAL(18,4) NOT NULL,
    "mtnus" DECIMAL(18,4) NOT NULL,
    "tnus" DECIMAL(18,4) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "raw_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "raw_data_history" (
    "id" SERIAL NOT NULL,
    "rawDataId" INTEGER NOT NULL,
    "changedById" INTEGER NOT NULL,
    "fieldName" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "raw_data_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "template_brs" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "jenisBrs" TEXT NOT NULL DEFAULT 'PARIWISATA',
    "version" INTEGER NOT NULL,
    "originalName" TEXT NOT NULL,
    "storedName" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "template_brs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dokumen_brs" (
    "id" SERIAL NOT NULL,
    "brsId" INTEGER NOT NULL,
    "templateId" INTEGER NOT NULL,
    "createdById" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "type" "DocumentType" NOT NULL DEFAULT 'DRAFT',
    "generationPayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dokumen_brs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE INDEX "user_roles_userId_idx" ON "user_roles"("userId");

-- CreateIndex
CREATE INDEX "user_roles_roleId_idx" ON "user_roles"("roleId");

-- CreateIndex
CREATE INDEX "brs_tahun_bulan_idx" ON "brs"("tahun", "bulan");

-- CreateIndex
CREATE UNIQUE INDEX "brs_jenisBrs_bulan_tahun_key" ON "brs"("jenisBrs", "bulan", "tahun");

-- CreateIndex
CREATE INDEX "data_uploads_brsId_status_idx" ON "data_uploads"("brsId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "data_uploads_brsId_version_key" ON "data_uploads"("brsId", "version");

-- CreateIndex
CREATE INDEX "raw_data_dataUploadId_idx" ON "raw_data"("dataUploadId");

-- CreateIndex
CREATE INDEX "raw_data_jenisAkomodasi_kelasAkomodasi_idx" ON "raw_data"("jenisAkomodasi", "kelasAkomodasi");

-- CreateIndex
CREATE INDEX "raw_data_history_rawDataId_idx" ON "raw_data_history"("rawDataId");

-- CreateIndex
CREATE INDEX "template_brs_jenisBrs_isActive_idx" ON "template_brs"("jenisBrs", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "template_brs_jenisBrs_version_key" ON "template_brs"("jenisBrs", "version");

-- CreateIndex
CREATE INDEX "dokumen_brs_brsId_idx" ON "dokumen_brs"("brsId");

-- CreateIndex
CREATE UNIQUE INDEX "dokumen_brs_brsId_version_key" ON "dokumen_brs"("brsId", "version");

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brs" ADD CONSTRAINT "brs_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data_uploads" ADD CONSTRAINT "data_uploads_brsId_fkey" FOREIGN KEY ("brsId") REFERENCES "brs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data_uploads" ADD CONSTRAINT "data_uploads_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raw_data" ADD CONSTRAINT "raw_data_dataUploadId_fkey" FOREIGN KEY ("dataUploadId") REFERENCES "data_uploads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raw_data_history" ADD CONSTRAINT "raw_data_history_rawDataId_fkey" FOREIGN KEY ("rawDataId") REFERENCES "raw_data"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raw_data_history" ADD CONSTRAINT "raw_data_history_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template_brs" ADD CONSTRAINT "template_brs_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dokumen_brs" ADD CONSTRAINT "dokumen_brs_brsId_fkey" FOREIGN KEY ("brsId") REFERENCES "brs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dokumen_brs" ADD CONSTRAINT "dokumen_brs_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "template_brs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dokumen_brs" ADD CONSTRAINT "dokumen_brs_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
