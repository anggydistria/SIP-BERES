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
  Modal,
  Textarea,
  Table,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { getBrsDetail } from '@/lib/api/brs';
import type { BrsDetail, BrsStatus } from '@/types/brs';
import { downloadBrsDocument } from '@/lib/api/brs-document';

import { downloadActiveExcel } from '@/lib/api/data-upload';
import { getDashboardSummary } from '@/lib/api/dashboard';

import type { DashboardSummary } from '@/types/dashboard';
import {
  approveFinalBrs,
  downloadPendingFinal,
  markDraftReady,
  rejectFinalBrs,
  submitFinalBrs,
  downloadApprovedFinal,
} from '@/lib/api/brs-final';
import { getBrsPreview } from '@/lib/api/brs-preview';

import type {
  BrsPreviewData,
  ChangeStatus,
} from '@/types/brs-preview';
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
  const [rejectNote, setRejectNote] = useState('');

  const [rejectOpened, rejectModal] = useDisclosure(false);
  const [summary, setSummary] =
    useState<DashboardSummary | null>(null);
  const [preview, setPreview] =
    useState<BrsPreviewData | null>(null);
  useEffect(() => {
    let cancelled = false;

    getBrsDetail(brsId)
      .then(async (result) => {
        if (cancelled) {
          return;
        }

        setBrs(result);
        setError(null);

        try {
          const [dashboardSummary, previewData] =
            await Promise.all([
              getDashboardSummary(
                result.bulan,
                result.tahun
              ),

              getBrsPreview(result.bulan, result.tahun),
            ]);

          if (!cancelled) {
            setSummary(dashboardSummary);
            setPreview(previewData);
          }
        } catch (caughtError) {
          if (!cancelled) {
            setError(errorMessage(caughtError));
          }
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

    const [dashboardSummary, previewData] =
      await Promise.all([
        getDashboardSummary(result.bulan, result.tahun),

        getBrsPreview(result.bulan, result.tahun),
      ]);

    setBrs(result);
    setSummary(dashboardSummary);
    setPreview(previewData);
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

  async function handleDownloadPending() {
    setActionLoading(true);
    setError(null);

    try {
      await downloadPendingFinal(brsId);
    } catch (caughtError) {
      setError(errorMessage(caughtError));
    } finally {
      setActionLoading(false);
    }
  }
  async function handleDownloadFinal() {
    setActionLoading(true);
    setError(null);

    try {
      await downloadApprovedFinal(brsId);
    } catch (caughtError) {
      setError(errorMessage(caughtError));
    } finally {
      setActionLoading(false);
    }
  }
  async function handleReject() {
    if (!rejectNote.trim()) {
      setError('Catatan penolakan wajib diisi.');

      return;
    }

    setActionLoading(true);
    setError(null);
    setMessage(null);

    try {
      await rejectFinalBrs(brsId, rejectNote.trim());

      await refresh();

      setRejectNote('');
      rejectModal.close();

      setMessage(
        'Calon BRS final ditolak dan catatan berhasil disimpan.'
      );
    } catch (caughtError) {
      setError(errorMessage(caughtError));
    } finally {
      setActionLoading(false);
    }
  }

  async function handleApprove() {
    const confirmed = window.confirm(
      'Yakin ingin menyetujui BRS ini sebagai BRS final?'
    );

    if (!confirmed) {
      return;
    }

    await runAction(
      () => approveFinalBrs(brsId),
      'BRS final berhasil disetujui.'
    );
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
  const previewData = preview;

  const activeExcel = brs.dataUploads[0] ?? null;
  const latestRejected = brs.reviewHistories.find(
    (history) => history.decision === 'REJECTED'
  );

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
          <Title order={4} mb={4}>
            Ringkasan BRS
          </Title>

          <Text size="sm" c="dimmed" mb="lg">
            Ringkasan indikator berdasarkan data Excel
            aktif.
          </Text>

          {!summary ? (
            <Alert
              color="yellow"
              title="Ringkasan belum tersedia"
            >
              Data indikator belum dapat ditampilkan.
            </Alert>
          ) : (
            <SimpleGrid
              cols={{
                base: 1,
                sm: 2,
                md: 4,
              }}
            >
              <IndicatorCard
                label="Malam Kamar Tersedia"
                value={formatNumber(
                  summary.indicators.malamKamarTersedia
                )}
              />

              <IndicatorCard
                label="Malam Kamar Terjual"
                value={formatNumber(
                  summary.indicators.malamKamarTerjual
                )}
              />

              <IndicatorCard
                label="Tamu Asing"
                value={formatNumber(
                  summary.indicators.tamuAsing
                )}
              />

              <IndicatorCard
                label="Tamu Nusantara"
                value={formatNumber(
                  summary.indicators.tamuNusantara
                )}
              />

              <IndicatorCard
                label="TPK"
                value={formatDecimal(
                  summary.indicators.tingkatPenghunianKamar,
                  '%'
                )}
              />

              <IndicatorCard
                label="Rata-rata Lama Menginap"
                value={formatDecimal(
                  summary.indicators.rataLamaMenginap,
                  ' malam'
                )}
              />

              <IndicatorCard
                label="RLM Tamu Asing"
                value={formatNullableDecimal(
                  summary.indicators.rataLamaMenginapAsing,
                  ' malam'
                )}
              />

              <IndicatorCard
                label="RLM Tamu Nusantara"
                value={formatNullableDecimal(
                  summary.indicators
                    .rataLamaMenginapNusantara,
                  ' malam'
                )}
              />
            </SimpleGrid>
          )}
        </Paper>
        <Paper
          withBorder
          p={{
            base: 'md',
            sm: 'xl',
          }}
          radius="md"
        >
          <Group
            justify="space-between"
            align="flex-start"
            mb="xl"
          >
            <div>
              <Text
                size="sm"
                fw={700}
                c="blue"
                tt="uppercase"
              >
                Preview BRS
              </Text>

              <Title order={2}>
                Perkembangan Pariwisata Kota Samarinda
              </Title>

              <Text size="lg" c="dimmed">
                {preview
                  ? preview.narrative.period.label
                  : `${MONTH_NAMES[brs.bulan]} ${brs.tahun}`}
              </Text>
            </div>

            {preview && (
              <Badge
                color={
                  preview.narrative.readyForFinal
                    ? 'green'
                    : 'yellow'
                }
                variant="light"
                size="lg"
              >
                {preview.narrative.readyForFinal
                  ? 'Data 13 Bulan Lengkap'
                  : `${preview.analytics.availability.historyMonthsAvailable}/${preview.analytics.availability.historyMonthsRequired} Bulan`}
              </Badge>
            )}
          </Group>

          {previewData === null ? (
            <Alert
              color="yellow"
              title="Preview belum tersedia"
            >
              Data preview BRS belum dapat ditampilkan.
            </Alert>
          ) : (
            <Stack gap="xl">
              {previewData.narrative.warnings.length >
                0 && (
                <Alert
                  color="yellow"
                  title="Kelengkapan data"
                >
                  <Stack gap={4}>
                    {previewData.narrative.warnings.map(
                      (warning, index) => (
                        <Text
                          size="sm"
                          key={`${warning}-${index}`}
                        >
                          {warning}
                        </Text>
                      )
                    )}
                  </Stack>
                </Alert>
              )}

              <div>
                <Title order={3} mb="md">
                  Ringkasan Utama
                </Title>

                {previewData.narrative.highlights.length ===
                0 ? (
                  <Text c="dimmed">
                    Ringkasan utama belum tersedia.
                  </Text>
                ) : (
                  <Stack gap="sm">
                    {previewData.narrative.highlights.map(
                      (highlight, index) => (
                        <Paper
                          key={`${highlight}-${index}`}
                          withBorder
                          p="md"
                          radius="md"
                          bg="blue.0"
                        >
                          <Text>{highlight}</Text>
                        </Paper>
                      )
                    )}
                  </Stack>
                )}
              </div>
            </Stack>
          )}
        </Paper>
        {previewData !== null && (
          <div>
            <Title order={3} mb="md">
              {previewData.narrative.sections.tpk.title}
            </Title>

            <Stack gap="sm" mb="lg">
              {previewData.narrative.sections.tpk.paragraphs.map(
                (paragraph, index) => (
                  <Text
                    key={`tpk-${index}`}
                    ta="justify"
                    lh={1.7}
                  >
                    {paragraph}
                  </Text>
                )
              )}
            </Stack>

            <Table.ScrollContainer minWidth={900}>
              <Table
                striped
                highlightOnHover
                withTableBorder
                withColumnBorders
              >
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Klasifikasi Hotel</Table.Th>

                    <Table.Th ta="right">
                      TPK Sekarang
                    </Table.Th>

                    <Table.Th ta="right">
                      Bulan Sebelumnya
                    </Table.Th>

                    <Table.Th ta="right">
                      Tahun Sebelumnya
                    </Table.Th>

                    <Table.Th>Perubahan Bulanan</Table.Th>

                    <Table.Th>Perubahan Tahunan</Table.Th>
                  </Table.Tr>
                </Table.Thead>

                <Table.Tbody>
                  <Table.Tr>
                    <Table.Td fw={700}>
                      Total Hotel Bintang
                    </Table.Td>

                    <Table.Td ta="right">
                      {formatPreviewNumber(
                        previewData.analytics.tpk.total
                          .current,
                        '%'
                      )}
                    </Table.Td>

                    <Table.Td ta="right">
                      {formatPreviewNumber(
                        previewData.analytics.tpk.total
                          .previousMonth,
                        '%'
                      )}
                    </Table.Td>

                    <Table.Td ta="right">
                      {formatPreviewNumber(
                        previewData.analytics.tpk.total
                          .previousYear,
                        '%'
                      )}
                    </Table.Td>

                    <Table.Td>
                      <ChangeValue
                        value={
                          previewData.analytics.tpk.total
                            .mtmChange
                        }
                        status={
                          previewData.analytics.tpk.total
                            .mtmStatus
                        }
                        suffix=" poin"
                      />
                    </Table.Td>

                    <Table.Td>
                      <ChangeValue
                        value={
                          previewData.analytics.tpk.total
                            .yoyChange
                        }
                        status={
                          previewData.analytics.tpk.total
                            .yoyStatus
                        }
                        suffix=" poin"
                      />
                    </Table.Td>
                  </Table.Tr>

                  {previewData.analytics.tpk.classifications
                    .filter(
                      (classification) =>
                        classification.key !==
                        'TOTAL_BINTANG'
                    )
                    .map((classification) => (
                      <Table.Tr key={classification.key}>
                        <Table.Td>
                          {classification.label}
                        </Table.Td>

                        <Table.Td ta="right">
                          {formatPreviewNumber(
                            classification.current,
                            '%'
                          )}
                        </Table.Td>

                        <Table.Td ta="right">
                          {formatPreviewNumber(
                            classification.previousMonth,
                            '%'
                          )}
                        </Table.Td>

                        <Table.Td ta="right">
                          {formatPreviewNumber(
                            classification.previousYear,
                            '%'
                          )}
                        </Table.Td>

                        <Table.Td>
                          <ChangeValue
                            value={classification.mtmChange}
                            status={
                              classification.mtmStatus
                            }
                            suffix=" poin"
                          />
                        </Table.Td>

                        <Table.Td>
                          <ChangeValue
                            value={classification.yoyChange}
                            status={
                              classification.yoyStatus
                            }
                            suffix=" poin"
                          />
                        </Table.Td>
                      </Table.Tr>
                    ))}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          </div>
        )}
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
            {brs.status === 'FINAL_REJECTED' &&
              latestRejected && (
                <Alert
                  color="red"
                  title="Perbaikan diperlukan"
                >
                  <Text mb={4}>
                    {latestRejected.note ??
                      'Tidak ada catatan penolakan.'}
                  </Text>

                  <Text size="xs" c="dimmed">
                    Ditolak oleh{' '}
                    {latestRejected.reviewedBy.name}
                    {' pada '}
                    {formatDateTime(
                      latestRejected.reviewedAt
                    )}
                  </Text>
                </Alert>
              )}
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
        {brs.status === 'FINAL_SUBMITTED' &&
          brs.finalSubmission && (
            <Paper withBorder p="lg" radius="md">
              <Group
                justify="space-between"
                align="flex-start"
                mb="lg"
              >
                <div>
                  <Title order={4}>
                    Review Calon BRS Final
                  </Title>

                  <Text size="sm" c="dimmed">
                    Periksa PDF sebelum memberikan
                    keputusan.
                  </Text>
                </div>

                <Badge color="orange" variant="light">
                  Versi {brs.finalSubmission.version}
                </Badge>
              </Group>

              <SimpleGrid
                cols={{
                  base: 1,
                  sm: 2,
                }}
                mb="lg"
              >
                <Info
                  label="Nama file"
                  value={brs.finalSubmission.originalName}
                />

                <Info
                  label="Nomor BRS yang diajukan"
                  value={
                    brs.finalSubmission.proposedNomorBrs
                  }
                />

                <Info
                  label="Tanggal publikasi"
                  value={
                    brs.finalSubmission
                      .proposedTanggalPublikasi
                      ? formatDate(
                          brs.finalSubmission
                            .proposedTanggalPublikasi
                        )
                      : 'Belum ditentukan'
                  }
                />

                <Info
                  label="Diajukan oleh"
                  value={
                    brs.finalSubmission.submittedBy.name
                  }
                />
              </SimpleGrid>

              <Group justify="flex-end">
                <Button
                  variant="light"
                  loading={actionLoading}
                  onClick={() => {
                    void handleDownloadPending();
                  }}
                >
                  Unduh dan Periksa PDF
                </Button>

                <Button
                  color="red"
                  variant="light"
                  disabled={actionLoading}
                  onClick={rejectModal.open}
                >
                  Tolak
                </Button>

                <Button
                  color="green"
                  loading={actionLoading}
                  onClick={() => {
                    void handleApprove();
                  }}
                >
                  Setujui
                </Button>
              </Group>

              <Paper withBorder p="lg" radius="md">
                <Title order={4} mb={4}>
                  Riwayat Review BRS Final
                </Title>

                <Text size="sm" c="dimmed" mb="lg">
                  Riwayat pengajuan, persetujuan, dan
                  penolakan BRS final.
                </Text>

                {brs.reviewHistories.length === 0 ? (
                  <Text c="dimmed" ta="center" py="lg">
                    Belum ada riwayat review.
                  </Text>
                ) : (
                  <Table.ScrollContainer minWidth={850}>
                    <Table
                      striped
                      highlightOnHover
                      withTableBorder
                    >
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>Versi</Table.Th>
                          <Table.Th>File</Table.Th>
                          <Table.Th>Nomor BRS</Table.Th>
                          <Table.Th>Pengelola</Table.Th>
                          <Table.Th>Keputusan</Table.Th>
                          <Table.Th>Catatan</Table.Th>
                          <Table.Th>Waktu Review</Table.Th>
                        </Table.Tr>
                      </Table.Thead>

                      <Table.Tbody>
                        {brs.reviewHistories.map(
                          (history) => (
                            <Table.Tr key={history.id}>
                              <Table.Td>
                                {history.submissionVersion}
                              </Table.Td>

                              <Table.Td>
                                {history.originalName}
                              </Table.Td>

                              <Table.Td>
                                {history.proposedNomorBrs}
                              </Table.Td>

                              <Table.Td>
                                {history.submittedBy.name}
                              </Table.Td>

                              <Table.Td>
                                <Badge
                                  color={
                                    history.decision ===
                                    'APPROVED'
                                      ? 'green'
                                      : 'red'
                                  }
                                  variant="light"
                                >
                                  {history.decision ===
                                  'APPROVED'
                                    ? 'Disetujui'
                                    : 'Ditolak'}
                                </Badge>
                              </Table.Td>

                              <Table.Td>
                                {history.note ?? '-'}
                              </Table.Td>

                              <Table.Td>
                                {formatDateTime(
                                  history.reviewedAt
                                )}
                              </Table.Td>
                            </Table.Tr>
                          )
                        )}
                      </Table.Tbody>
                    </Table>
                  </Table.ScrollContainer>
                )}
              </Paper>
            </Paper>
          )}

        {brs.status === 'FINAL' && brs.finalFile && (
          <Paper withBorder p="lg" radius="md">
            <Group
              justify="space-between"
              align="flex-start"
              mb="lg"
            >
              <div>
                <Title order={4}>BRS Final</Title>

                <Text size="sm" c="dimmed">
                  Dokumen ini sudah disetujui dan menjadi
                  BRS final.
                </Text>
              </div>

              <Badge
                color="green"
                size="lg"
                variant="light"
              >
                Disetujui
              </Badge>
            </Group>

            <SimpleGrid
              cols={{
                base: 1,
                sm: 2,
                md: 4,
              }}
              mb="lg"
            >
              <Info
                label="Nama file"
                value={brs.finalFile.originalName}
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

              <Info
                label="Disetujui oleh"
                value={brs.finalFile.approvedBy.name}
              />
            </SimpleGrid>

            <Group justify="flex-end">
              <Button
                color="green"
                loading={actionLoading}
                onClick={() => {
                  void handleDownloadFinal();
                }}
              >
                Unduh BRS Final
              </Button>
            </Group>
          </Paper>
        )}

        {brs.status === 'FINAL' && !brs.finalFile && (
          <Alert
            color="red"
            title="File final tidak ditemukan"
          >
            Status BRS sudah final, tetapi informasi PDF
            final tidak tersedia.
          </Alert>
        )}
      </Stack>
      <Modal
        opened={rejectOpened}
        onClose={rejectModal.close}
        title="Tolak Calon BRS Final"
        centered
      >
        <Stack>
          <Textarea
            label="Catatan penolakan"
            description="Jelaskan bagian yang perlu diperbaiki"
            placeholder="Contoh: Perbaiki narasi TPK dan nomor BRS."
            value={rejectNote}
            onChange={(event) => {
              setRejectNote(event.currentTarget.value);
            }}
            minRows={4}
            required
          />

          <Group justify="flex-end">
            <Button
              variant="default"
              disabled={actionLoading}
              onClick={rejectModal.close}
            >
              Batal
            </Button>

            <Button
              color="red"
              loading={actionLoading}
              disabled={!rejectNote.trim()}
              onClick={() => {
                void handleReject();
              }}
            >
              Tolak BRS
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}

interface ChangeValueProps {
  value: number | null;
  status: ChangeStatus;
  suffix?: string;
}

function ChangeValue({
  value,
  status,
  suffix = '',
}: ChangeValueProps) {
  if (value === null || status === 'TIDAK_TERSEDIA') {
    return (
      <Text size="sm" c="dimmed">
        Tidak tersedia
      </Text>
    );
  }

  const color = {
    NAIK: 'green',
    TURUN: 'red',
    TETAP: 'gray',
    TIDAK_TERSEDIA: 'gray',
  }[status];

  const label = {
    NAIK: 'Naik',
    TURUN: 'Turun',
    TETAP: 'Tetap',
    TIDAK_TERSEDIA: 'Tidak tersedia',
  }[status];

  return (
    <Badge color={color} variant="light">
      {label} {formatPreviewNumber(Math.abs(value), suffix)}
    </Badge>
  );
}

interface IndicatorCardProps {
  label: string;
  value: string;
}

function IndicatorCard({
  label,
  value,
}: IndicatorCardProps) {
  return (
    <Paper withBorder p="md" radius="md" bg="gray.0">
      <Text size="sm" c="dimmed" mb={6}>
        {label}
      </Text>

      <Text fw={700} size="xl">
        {value}
      </Text>
    </Paper>
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
function formatDateTime(value: string) {
  return new Date(value).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('id-ID').format(value);
}

function formatDecimal(value: number, suffix = '') {
  return (
    new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value) + suffix
  );
}

function formatNullableDecimal(
  value: number | null,
  suffix = ''
) {
  if (value === null) {
    return '-';
  }

  return formatDecimal(value, suffix);
}

function formatPreviewNumber(
  value: number | null,
  suffix = ''
) {
  if (value === null) {
    return '-';
  }

  return (
    new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value) + suffix
  );
}
