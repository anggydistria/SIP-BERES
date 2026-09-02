'use client';

import {
  Alert,
  Badge,
  Button,
  Container,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Title,
  FileInput,
  TextInput,
} from '@mantine/core';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { getBrsDetail } from '@/lib/api/brs';
import type { BrsDetail, BrsStatus } from '@/types/brs';
import { downloadBrsDocument } from '@/lib/api/brs-document';

import { downloadActiveExcel } from '@/lib/api/data-upload';

import { markDraftReady } from '@/lib/api/brs-final';

const MONTH_NAMES = [
  '',
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

const STATUS: Record<
  BrsStatus,
  {
    label: string;
    color: string;
  }
> = {
  DRAFT: {
    label: 'Draft',
    color: 'gray',
  },

  DRAFT_READY: {
    label: 'Draft Siap',
    color: 'blue',
  },

  FINAL_SUBMITTED: {
    label: 'Menunggu Review',
    color: 'orange',
  },

  FINAL_REJECTED: {
    label: 'Ditolak',
    color: 'red',
  },

  FINAL: {
    label: 'Final',
    color: 'green',
  },
};

export default function BrsDetailPage() {
  const params = useParams<{
    id: string;
  }>();

  const brsId = Number(params.id);

  const [brs, setBrs] = useState<BrsDetail | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(
    null
  );

  const [actionLoading, setActionLoading] = useState(false);
  const [finalFile, setFinalFile] = useState<File | null>(
    null
  );

  const [nomorBrs, setNomorBrs] = useState('');

  const [tanggalPublikasi, setTanggalPublikasi] =
    useState('');

  useEffect(() => {
    let cancelled = false;

    getBrsDetail(brsId)
      .then((result) => {
        if (!cancelled) {
          setBrs(result);
          setError(null);
        }
      })
      .catch((caughtError: unknown) => {
        if (!cancelled) {
          setError(errorMessage(caughtError));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [brsId]);

  async function refresh() {
    const result = await getBrsDetail(brsId);

    setBrs(result);
  }

  async function runAction(
    action: () => Promise<unknown>,
    successMessage: string
  ) {
    setActionLoading(true);
    setError(null);
    setMessage(null);

    try {
      await action();
      await refresh();

      setMessage(successMessage);
    } catch (caughtError) {
      setError(errorMessage(caughtError));
    } finally {
      setActionLoading(false);
    }
  }

  async function handleMarkDraftReady() {
    await runAction(
      () => markDraftReady(brsId),
      'Draft BRS berhasil dinyatakan siap.'
    );
  }

  async function handleDownloadExcel() {
    const activeExcel = brs?.dataUploads[0];

    if (!activeExcel) {
      setError('Data Excel aktif belum tersedia.');

      return;
    }

    setActionLoading(true);
    setError(null);

    try {
      await downloadActiveExcel(activeExcel.id);
    } catch (caughtError) {
      setError(errorMessage(caughtError));
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDownloadDraft() {
    if (!brs) {
      return;
    }

    setActionLoading(true);
    setError(null);

    try {
      const result = await downloadBrsDocument(
        brs.bulan,
        brs.tahun
      );

      saveBlob(result.blob, result.filename);
    } catch (caughtError) {
      setError(errorMessage(caughtError));
    } finally {
      setActionLoading(false);
    }
  }

  async function handleSubmitFinal() {
    if (!finalFile) {
      setError('File calon BRS final wajib dipilih.');

      return;
    }

    if (!nomorBrs.trim()) {
      setError('Nomor BRS wajib diisi.');

      return;
    }

    setActionLoading(true);
    setError(null);
    setMessage(null);

    try {
      await submitFinalBrs(
        brsId,
        finalFile,
        nomorBrs.trim(),
        tanggalPublikasi || undefined
      );

      await refresh();

      setFinalFile(null);
      setNomorBrs('');
      setTanggalPublikasi('');

      setMessage(
        'Calon BRS final berhasil dikirim untuk direview.'
      );
    } catch (caughtError) {
      setError(errorMessage(caughtError));
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <Container size="xl" py="xl">
        <Text c="dimmed">Memuat detail BRS...</Text>
      </Container>
    );
  }

  if (!brs) {
    return (
      <Container size="xl" py="xl">
        <Alert color="red" title="Detail BRS gagal dimuat">
          {error ?? 'BRS tidak ditemukan'}
        </Alert>
      </Container>
    );
  }

  const activeExcel = brs.dataUploads[0] ?? null;

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        <Group justify="space-between" align="flex-start">
          <div>
            <Button
              component={Link}
              href="/brs"
              variant="subtle"
              px={0}
            >
              Kembali ke daftar BRS
            </Button>

            <Title order={2}>
              BRS {MONTH_NAMES[brs.bulan]} {brs.tahun}
            </Title>

            <Text c="dimmed">
              Kelola draft, review, dan PDF final.
            </Text>
          </div>

          <Badge
            size="lg"
            color={STATUS[brs.status].color}
            variant="light"
          >
            {STATUS[brs.status].label}
          </Badge>
        </Group>

        {error && (
          <Alert color="red" title="Terjadi kesalahan">
            {error}
          </Alert>
        )}

        {message && (
          <Alert
            color="green"
            title="Berhasil"
            withCloseButton
            onClose={() => setMessage(null)}
          >
            {message}
          </Alert>
        )}

        <Paper withBorder p="lg" radius="md">
          <Title order={4} mb="md">
            Informasi BRS
          </Title>

          <SimpleGrid
            cols={{
              base: 1,
              sm: 2,
              md: 4,
            }}
          >
            <Info label="Tahun" value={String(brs.tahun)} />

            <Info
              label="Bulan"
              value={MONTH_NAMES[brs.bulan]}
            />

            <Info
              label="Nomor BRS"
              value={brs.nomorBrs ?? 'Belum ditetapkan'}
            />

            <Info
              label="Tanggal publikasi"
              value={
                brs.tanggalPublikasi
                  ? formatDate(brs.tanggalPublikasi)
                  : 'Belum ditetapkan'
              }
            />
          </SimpleGrid>
        </Paper>
        <Paper withBorder p="lg" radius="md">
          <Group
            justify="space-between"
            align="flex-start"
            mb="md"
          >
            <div>
              <Title order={4}>
                Data Excel dan Draft BRS
              </Title>

              <Text size="sm" c="dimmed">
                Data Excel menjadi sumber pembuatan draft
                BRS.
              </Text>
            </div>

            {activeExcel && (
              <Badge color="green" variant="light">
                {activeExcel.rowCount} baris
              </Badge>
            )}
          </Group>

          {!activeExcel ? (
            <Alert
              color="yellow"
              title="Data belum tersedia"
            >
              BRS ini belum mempunyai data Excel aktif.
            </Alert>
          ) : (
            <Stack gap="md">
              <SimpleGrid
                cols={{
                  base: 1,
                  sm: 3,
                }}
              >
                <Info
                  label="Nama file"
                  value={activeExcel.originalName}
                />

                <Info
                  label="Jumlah baris"
                  value={String(activeExcel.rowCount)}
                />

                <Info
                  label="Tanggal upload"
                  value={formatDate(activeExcel.uploadedAt)}
                />
              </SimpleGrid>

              <Group>
                <Button
                  variant="light"
                  loading={actionLoading}
                  onClick={() => {
                    void handleDownloadExcel();
                  }}
                >
                  Unduh Excel
                </Button>

                <Button
                  variant="light"
                  color="orange"
                  loading={actionLoading}
                  onClick={() => {
                    void handleDownloadDraft();
                  }}
                >
                  Unduh Draft Word
                </Button>

                {brs.status === 'DRAFT' && (
                  <Button
                    color="blue"
                    loading={actionLoading}
                    onClick={() => {
                      void handleMarkDraftReady();
                    }}
                  >
                    Draft Sudah Siap
                  </Button>
                )}
              </Group>

              {brs.status === 'DRAFT_READY' && (
                <Alert
                  color="blue"
                  title="Draft sudah siap"
                >
                  Pengelola sudah dapat mengunggah calon PDF
                  BRS final.
                </Alert>
              )}
            </Stack>
          )}
        </Paper>
        {(brs.status === 'DRAFT_READY' ||
          brs.status === 'FINAL_REJECTED') && (
          <Paper withBorder p="lg" radius="md">
            <Title order={4} mb={4}>
              Unggah Calon BRS Final
            </Title>

            <Text size="sm" c="dimmed" mb="lg">
              Unggah PDF yang sudah diperbaiki oleh Petugas
              Pengelola untuk diperiksa Ketua BRS.
            </Text>

            {brs.status === 'FINAL_REJECTED' && (
              <Alert
                color="red"
                title="Pengajuan sebelumnya ditolak"
                mb="md"
              >
                Silakan perbaiki BRS sesuai catatan Ketua,
                kemudian unggah kembali PDF perbaikannya.
              </Alert>
            )}

            <Stack gap="md">
              <FileInput
                label="File calon BRS final"
                description="Format PDF, maksimal 20 MB"
                placeholder="Pilih file PDF"
                accept="application/pdf,.pdf"
                value={finalFile}
                onChange={setFinalFile}
                clearable
                required
              />

              <SimpleGrid
                cols={{
                  base: 1,
                  sm: 2,
                }}
              >
                <TextInput
                  label="Nomor BRS"
                  placeholder="Contoh: 15/09/6472/Th. II"
                  value={nomorBrs}
                  onChange={(event) => {
                    setNomorBrs(event.currentTarget.value);
                  }}
                  required
                />

                <TextInput
                  type="date"
                  label="Tanggal publikasi"
                  value={tanggalPublikasi}
                  onChange={(event) => {
                    setTanggalPublikasi(
                      event.currentTarget.value
                    );
                  }}
                />
              </SimpleGrid>

              <Group justify="flex-end">
                <Button
                  color="orange"
                  loading={actionLoading}
                  disabled={!finalFile || !nomorBrs.trim()}
                  onClick={() => {
                    void handleSubmitFinal();
                  }}
                >
                  Kirim untuk Review
                </Button>
              </Group>
            </Stack>
          </Paper>
        )}
      </Stack>
    </Container>
  );
}

interface InfoProps {
  label: string;
  value: string;
}

function Info({ label, value }: InfoProps) {
  return (
    <div>
      <Text size="sm" c="dimmed" mb={4}>
        {label}
      </Text>

      <Text fw={600}>{value}</Text>
    </div>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function errorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : 'Terjadi kesalahan';
}

function saveBlob(blob: Blob, filename: string) {
  const objectUrl = URL.createObjectURL(blob);

  const anchor = document.createElement('a');

  anchor.href = objectUrl;
  anchor.download = filename;

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  URL.revokeObjectURL(objectUrl);
}
