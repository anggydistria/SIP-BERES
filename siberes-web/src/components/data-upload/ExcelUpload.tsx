'use client';

import {
  Alert,
  Badge,
  Button,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core';
import { Dropzone, MIME_TYPES } from '@mantine/dropzone';
import { useState } from 'react';
import Link from 'next/link';
import {
  previewExcel,
  saveExcel,
} from '@/lib/api/data-upload';
import type {
  ExcelPreviewResponse,
  SaveExcelResponse,
} from '@/types/data-upload';

const MAX_FILE_SIZE = 20 * 1024 * 1024;

const numberFormatter = new Intl.NumberFormat('id-ID');

export function ExcelUpload() {
  const [file, setFile] = useState<File | null>(null);

  const [preview, setPreview] =
    useState<ExcelPreviewResponse | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [saveResult, setSaveResult] =
    useState<SaveExcelResponse | null>(null);
    const [month, setMonth] = useState<string | null>(null);

    const [year, setYear] = useState<number | string>(
      new Date().getFullYear()
    );

  function handleFile(fileToUpload: File) {
    setFile(fileToUpload);
    setPreview(null);
    setSaveResult(null);
    setError(null);
  }

  async function handlePreview() {
    if (!file) {
      setError('Pilih file Excel terlebih dahulu');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSaveResult(null);
    try {
  const selectedPeriod = {
    bulan: Number(month),
    tahun: Number(year),
  };

  const result = await previewExcel(file, selectedPeriod);
    } catch (caughtError) {
      setPreview(null);

      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Gagal membaca file Excel'
      );
    } finally {
      setIsLoading(false);
    }
  }
  async function handleSave() {
    if (!file || !preview) {
      setError(
        'File harus ditampilkan dalam preview terlebih dahulu'
      );

      return;
    }

    if (preview.invalidRows > 0) {
      setError(
        'Data yang tidak valid harus diperbaiki sebelum disimpan'
      );

      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const selectedPeriod = {
        bulan: Number(month),
        tahun: Number(year),
      };

      const result = await saveExcel(file, selectedPeriod);

      setSaveResult(result);
    } catch (caughtError) {
      setSaveResult(null);

      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Gagal menyimpan data Excel'
      );
    } finally {
      setIsSaving(false);
    }
  }
  return (
    <Stack gap="lg">
      <div>
        <Title order={2}>Unggah Data BRS</Title>
        <NumberInput
          label="Tahun"
          value={year}
          onChange={setYear}
          min={2000}
          max={2100}
          allowDecimal={false}
          required
        />

        <Select
          label="Bulan"
          placeholder="Pilih bulan"
          data={MONTH_OPTIONS}
          value={month}
          onChange={setMonth}
          required
        />
        <Text c="dimmed" mt={4}>
          Unggah file Excel untuk menampilkan data estimasi
          Kota Samarinda.
        </Text>
      </div>

      <Paper withBorder p="lg" radius="md">
        <Stack>
          <Dropzone
            accept={[MIME_TYPES.xlsx, MIME_TYPES.xls]}
            maxSize={MAX_FILE_SIZE}
            multiple={false}
            onDrop={(files) => {
              const selectedFile = files[0];

              if (selectedFile) {
                handleFile(selectedFile);
              }
            }}
            onReject={() => {
              setFile(null);
              setPreview(null);
              setError(
                'File harus berformat Excel dan maksimal 20 MB'
              );
              setSaveResult(null);
            }}
          >
            <Stack
              align="center"
              justify="center"
              mih={160}
              gap="xs"
              style={{
                pointerEvents: 'none',
              }}
            >
              <Dropzone.Accept>
                <Text fw={600} c="blue">
                  Lepaskan file di sini
                </Text>
              </Dropzone.Accept>

              <Dropzone.Reject>
                <Text fw={600} c="red">
                  File tidak dapat digunakan
                </Text>
              </Dropzone.Reject>

              <Dropzone.Idle>
                <Text fw={600}>
                  Seret file Excel ke sini
                </Text>

                <Text size="sm" c="dimmed">
                  atau klik untuk memilih file
                </Text>
              </Dropzone.Idle>
            </Stack>
          </Dropzone>

          {file && (
            <Alert color="blue" title="File terpilih">
              {file.name}
            </Alert>
          )}

          {error && (
            <Alert color="red" title="Terjadi kesalahan">
              {error}
            </Alert>
          )}

          <Group justify="flex-end">
            <Button
              onClick={handlePreview}
              loading={isLoading}
              disabled={!file}
            >
              Tampilkan Preview
            </Button>
          </Group>
        </Stack>
      </Paper>

      {preview && (
        <>
          <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }}>
            <InformationCard
              label="Periode"
              value={preview.period.label}
            />

            <InformationCard
              label="Wilayah"
              value={preview.location.name}
            />

            <InformationCard
              label="Data valid"
              value={String(preview.validRows)}
            />

            <InformationCard
              label="Data tidak valid"
              value={String(preview.invalidRows)}
            />
          </SimpleGrid>

          <Paper withBorder radius="md">
            <Group justify="space-between" p="md">
              <div>
                <Text fw={600}>Preview Data Excel</Text>

                <Text size="sm" c="dimmed">
                  Sheet {preview.sheetName}
                </Text>
              </div>

              <Badge
                color={
                  preview.invalidRows === 0
                    ? 'green'
                    : 'red'
                }
              >
                {preview.validRows} dari {preview.totalRows}{' '}
                valid
              </Badge>
            </Group>

            <Table.ScrollContainer minWidth={1000}>
              <Table
                striped
                highlightOnHover
                withTableBorder
                withColumnBorders
              >
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Baris</Table.Th>
                    <Table.Th>Jenis</Table.Th>
                    <Table.Th>Kelas</Table.Th>
                    <Table.Th>MKTJ</Table.Th>
                    <Table.Th>MKTS</Table.Th>
                    <Table.Th>MTA</Table.Th>
                    <Table.Th>TA</Table.Th>
                    <Table.Th>MTNUS</Table.Th>
                    <Table.Th>TNUS</Table.Th>
                  </Table.Tr>
                </Table.Thead>

                <Table.Tbody>
                  {preview.data.map((row) => (
                    <Table.Tr
                      key={`${row.sourceRow}-${row.jenisAkomodasi}-${row.kelasAkomodasi}`}
                    >
                      <Table.Td>{row.sourceRow}</Table.Td>

                      <Table.Td>
                        {row.jenisAkomodasi}
                      </Table.Td>

                      <Table.Td>
                        {row.kelasAkomodasi}
                      </Table.Td>

                      <NumericCell value={row.mktj} />
                      <NumericCell value={row.mkts} />
                      <NumericCell value={row.mta} />
                      <NumericCell value={row.ta} />
                      <NumericCell value={row.mtnus} />
                      <NumericCell value={row.tnus} />
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          </Paper>

          {preview.errors.length > 0 && (
            <Alert
              color="red"
              title="Data Excel tidak valid"
            >
              <Stack gap={4}>
                {preview.errors.map((item) => (
                  <Text key={item.sourceRow} size="sm">
                    Baris {item.sourceRow}: {item.message}
                  </Text>
                ))}
              </Stack>
            </Alert>
          )}

          <Group justify="flex-end">
            <Stack gap="sm">
              {saveResult && (
                <Alert
                  color="green"
                  title="Data berhasil disimpan"
                >
                  <Text size="sm">
                    {saveResult.dataUpload.rowCount} baris
                    data {saveResult.period.label} berhasil
                    disimpan sebagai versi{' '}
                    {saveResult.dataUpload.version}.
                  </Text>
                  <Group mt="md">
                    <Button
                      component={Link}
                      href="/brs"
                      variant="light"
                      color="green"
                    >
                      Lihat Daftar BRS
                    </Button>
                  </Group>
                </Alert>
              )}

              <Group justify="flex-end">
                <Button
                  color="green"
                  onClick={handleSave}
                  loading={isSaving}
                  disabled={
                    !file ||
                    preview.invalidRows > 0 ||
                    Boolean(saveResult)
                  }
                >
                  {saveResult
                    ? 'Data Tersimpan'
                    : 'Simpan Data'}
                </Button>
              </Group>
            </Stack>
          </Group>
        </>
      )}
    </Stack>
  );
}

function InformationCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <Paper withBorder p="md" radius="md">
      <Text size="sm" c="dimmed">
        {label}
      </Text>

      <Text fw={700} mt={4}>
        {value}
      </Text>
    </Paper>
  );
}

function NumericCell({ value }: { value: number }) {
  return (
    <Table.Td ta="right">
      {numberFormatter.format(value)}
    </Table.Td>
  );
}
