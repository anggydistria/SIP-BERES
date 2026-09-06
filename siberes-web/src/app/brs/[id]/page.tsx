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
  Tabs,
  Stepper,
  ThemeIcon,
} from '@mantine/core';
import {
  IconAlertTriangle,
  IconArrowLeft,
  IconCircleCheck,
  IconEye,
  IconFileCheck,
  IconFileSpreadsheet,
  IconHistory,
  IconInfoCircle,
  IconBed,
  IconBuilding,
  IconCalendar,
  IconCalendarEvent,
  IconFileText,
  IconHash,
  IconMapPin,
  IconPercentage,
  IconPlane,
  IconTag,
  IconClock,
  IconUsers,
  IconWorld,
  IconTable,
  IconCircleX,
  IconFolder,
  IconFileTypeDocx,
  IconDownload,
  IconFileTypePdf,
  IconSend,
  IconUpload,
  IconUser,
  
} from '@tabler/icons-react';

import { useDisclosure } from '@mantine/hooks';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  useEffect,
  useState,
  type ComponentType,
} from 'react';

import { getBrsDetail } from '@/lib/api/brs';
import type { BrsDetail, BrsStatus } from '@/types/brs';
import { downloadBrsDocument } from '@/lib/api/brs-document';

import { downloadActiveExcel } from '@/lib/api/data-upload';
import { getDashboardSummary } from '@/lib/api/dashboard';

import type { DashboardSummary } from '@/types/dashboard';
import {
  approveFinalBrs,
  downloadApprovedFinal,
  downloadPendingFinal,
  markDraftReady,
  previewApprovedFinal,
  previewPendingFinal,
  rejectFinalBrs,
  submitFinalBrs,
} from '@/lib/api/brs-final';
import { getBrsPreview } from '@/lib/api/brs-preview';

import type {
  BrsPreviewData,
  ChangeStatus,
  MetricComparison,
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

  const { hasRole } = useAuth();

  const isKetua = hasRole('KETUA_BRS');

  const isPengelola = hasRole('PENGELOLA');

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
  function handlePreviewPending() {
    setError(null);

    try {
      previewPendingFinal(brsId);
    } catch (caughtError) {
      setError(errorMessage(caughtError));
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
  function handlePreviewFinal() {
    setError(null);

    try {
      previewApprovedFinal(brsId);
    } catch (caughtError) {
      setError(errorMessage(caughtError));
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
  const workflowStep: Record<BrsStatus, number> = {
    DRAFT: 0,
    DRAFT_READY: 1,
    FINAL_SUBMITTED: 2,
    FINAL_REJECTED: 2,
    FINAL: 3,
  };

  const StatusIcon =
    brs.status === 'FINAL'
      ? IconCircleCheck
      : brs.status === 'FINAL_REJECTED'
        ? IconAlertTriangle
        : IconClock;
  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        <Paper withBorder p="lg">
          <Stack gap="lg">
            <Group
              justify="space-between"
              align="flex-start"
            >
              <Group align="flex-start" wrap="nowrap">
                <ThemeIcon
                  size={54}
                  radius="md"
                  variant="gradient"
                  gradient={{
                    from: 'bpsBlue.6',
                    to: 'bpsGreen.6',
                    deg: 135,
                  }}
                >
                  <IconFileText size={29} stroke={1.8} />
                </ThemeIcon>

                <div>
                  <Button
                    component={Link}
                    href="/brs"
                    variant="subtle"
                    size="compact-sm"
                    px={0}
                    leftSection={
                      <IconArrowLeft size={16} />
                    }
                  >
                    Daftar BRS
                  </Button>

                  <Title order={2} mt={4}>
                    BRS {MONTH_NAMES[brs.bulan]} {brs.tahun}
                  </Title>

                  <Text c="dimmed" mt={2}>
                    Kelola data, draft, proses review, dan
                    publikasi BRS final.
                  </Text>
                </div>
              </Group>

              <Badge
                size="lg"
                color={
                  brs.status === 'FINAL'
                    ? 'bpsGreen'
                    : brs.status === 'FINAL_REJECTED'
                      ? 'red'
                      : brs.status === 'FINAL_SUBMITTED'
                        ? 'bpsOrange'
                        : 'bpsBlue'
                }
                variant="light"
                leftSection={
                  <StatusIcon size={14} stroke={2} />
                }
              >
                {STATUS[brs.status].label}
              </Badge>
            </Group>

            <Paper withBorder p="md" bg="white" shadow="xs">
              <div
                style={{
                  overflowX: 'auto',
                }}
              >
                <div
                  style={{
                    minWidth: 680,
                  }}
                >
                  <Stepper
                    active={workflowStep[brs.status]}
                    color={
                      brs.status === 'FINAL_REJECTED'
                        ? 'red'
                        : 'bpsBlue'
                    }
                    size="sm"
                    allowNextStepsSelect={false}
                  >
                    <Stepper.Step
                      label="Data Excel"
                      description="Data berhasil diunggah"
                      icon={
                        <IconFileSpreadsheet size={18} />
                      }
                    />

                    <Stepper.Step
                      label="Draft Siap"
                      description="Draft selesai diperiksa"
                      icon={<IconFileText size={18} />}
                    />

                    <Stepper.Step
                      label="Review Final"
                      description={
                        brs.status === 'FINAL_REJECTED'
                          ? 'Perlu diperbaiki'
                          : 'Diperiksa Ketua BRS'
                      }
                      icon={
                        brs.status === 'FINAL_REJECTED' ? (
                          <IconAlertTriangle size={18} />
                        ) : (
                          <IconEye size={18} />
                        )
                      }
                    />

                    <Stepper.Step
                      label="BRS Final"
                      description="Disetujui dan dipublikasi"
                      icon={<IconFileCheck size={18} />}
                    />
                  </Stepper>
                </div>
              </div>
            </Paper>
          </Stack>
        </Paper>
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

        <Tabs
          defaultValue="informasi"
          variant="pills"
          color="bpsBlue"
          radius="md"
        >
          <Tabs.List
            grow
            p={6}
            bg="bpsBlue.0"
            style={{
              borderRadius: 'var(--mantine-radius-md)',
            }}
          >
            <Tabs.Tab
              value="informasi"
              leftSection={<IconInfoCircle size={18} />}
            >
              Informasi dan Proses
            </Tabs.Tab>

            <Tabs.Tab
              value="preview"
              leftSection={<IconEye size={18} />}
            >
              Preview BRS
            </Tabs.Tab>

            <Tabs.Tab
              value="dokumen"
              leftSection={<IconFolder size={18} />}
            >
              Dokumen dan Proses
            </Tabs.Tab>

            <Tabs.Tab
              value="review"
              leftSection={<IconHistory size={18} />}
            >
              Riwayat Review
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="informasi" pt="lg">
            <Stack gap="lg">
              <Paper withBorder p="lg" shadow="xs">
                <Group mb="lg" wrap="nowrap">
                  <ThemeIcon
                    color="bpsBlue"
                    variant="light"
                    size={42}
                  >
                    <IconFileText size={23} />
                  </ThemeIcon>

                  <div>
                    <Title order={4}>Informasi BRS</Title>

                    <Text size="sm" c="dimmed">
                      Identitas dan informasi publikasi BRS.
                    </Text>
                  </div>
                </Group>

                <SimpleGrid
                  cols={{
                    base: 1,
                    sm: 2,
                    lg: 4,
                  }}
                >
                  <MetadataCard
                    icon={IconCalendar}
                    color="bpsBlue"
                    label="Periode"
                    value={`${MONTH_NAMES[brs.bulan]} ${brs.tahun}`}
                  />

                  <MetadataCard
                    icon={IconTag}
                    color="bpsGreen"
                    label="Jenis BRS"
                    value={brs.jenisBrs}
                  />

                  <MetadataCard
                    icon={IconHash}
                    color="bpsOrange"
                    label="Nomor BRS"
                    value={
                      brs.nomorBrs ?? 'Belum ditetapkan'
                    }
                  />

                  <MetadataCard
                    icon={IconCalendarEvent}
                    color="bpsBlue"
                    label="Tanggal Publikasi"
                    value={
                      brs.tanggalPublikasi
                        ? formatDate(brs.tanggalPublikasi)
                        : 'Belum ditetapkan'
                    }
                  />
                </SimpleGrid>
              </Paper>

              <Paper withBorder p="lg" shadow="xs">
                <Group mb="lg" wrap="nowrap">
                  <ThemeIcon
                    color="bpsGreen"
                    variant="light"
                    size={42}
                  >
                    <IconBuilding size={23} />
                  </ThemeIcon>

                  <div>
                    <Title order={4}>Ringkasan BRS</Title>

                    <Text size="sm" c="dimmed">
                      Ringkasan indikator berdasarkan data
                      Excel aktif.
                    </Text>
                  </div>
                </Group>

                {!summary ? (
                  <Alert
                    color="bpsOrange"
                    title="Ringkasan belum tersedia"
                  >
                    Data indikator belum dapat ditampilkan.
                  </Alert>
                ) : (
                  <SimpleGrid
                    cols={{
                      base: 1,
                      sm: 2,
                      lg: 4,
                    }}
                  >
                    <IndicatorCard
                      icon={IconBuilding}
                      color="bpsBlue"
                      label="Malam Kamar Tersedia"
                      value={formatNumber(
                        summary.indicators
                          .malamKamarTersedia
                      )}
                    />

                    <IndicatorCard
                      icon={IconBed}
                      color="bpsOrange"
                      label="Malam Kamar Terjual"
                      value={formatNumber(
                        summary.indicators.malamKamarTerjual
                      )}
                    />

                    <IndicatorCard
                      icon={IconPlane}
                      color="bpsGreen"
                      label="Tamu Asing"
                      value={formatNumber(
                        summary.indicators.tamuAsing
                      )}
                    />

                    <IndicatorCard
                      icon={IconUsers}
                      color="bpsBlue"
                      label="Tamu Nusantara"
                      value={formatNumber(
                        summary.indicators.tamuNusantara
                      )}
                    />

                    <IndicatorCard
                      icon={IconPercentage}
                      color="bpsOrange"
                      label="TPK"
                      value={formatDecimal(
                        summary.indicators
                          .tingkatPenghunianKamar,
                        '%'
                      )}
                    />

                    <IndicatorCard
                      icon={IconClock}
                      color="bpsGreen"
                      label="Rata-rata Lama Menginap"
                      value={formatDecimal(
                        summary.indicators.rataLamaMenginap,
                        ' malam'
                      )}
                    />

                    <IndicatorCard
                      icon={IconWorld}
                      color="bpsOrange"
                      label="RLM Tamu Asing"
                      value={formatNullableDecimal(
                        summary.indicators
                          .rataLamaMenginapAsing,
                        ' malam'
                      )}
                    />

                    <IndicatorCard
                      icon={IconMapPin}
                      color="bpsGreen"
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
            </Stack>
          </Tabs.Panel>
          <Tabs.Panel value="preview" pt="lg">
            <PreviewOverview
              brs={brs}
              preview={previewData}
            />
            {previewData !== null && (
              <Tabs
                defaultValue="tpk"
                variant="outline"
                color="bpsBlue"
                radius="md"
              >
                <Tabs.List grow>
                  <Tabs.Tab
                    value="tpk"
                    leftSection={
                      <IconPercentage size={17} />
                    }
                  >
                    TPK
                  </Tabs.Tab>

                  <Tabs.Tab
                    value="rlmt"
                    leftSection={<IconClock size={17} />}
                  >
                    RLMT
                  </Tabs.Tab>

                  <Tabs.Tab
                    value="data"
                    leftSection={<IconTable size={17} />}
                  >
                    Data 13 Bulan
                  </Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="tpk" pt="lg">
                  <Paper
                    withBorder
                    p={{
                      base: 'md',
                      sm: 'lg',
                    }}
                    shadow="xs"
                  >
                    <div>
                      <Title order={3} mb="md">
                        {
                          previewData.narrative.sections.tpk
                            .title
                        }
                      </Title>

                      <Stack gap="sm" mb="lg"></Stack>

                      <Table.ScrollContainer minWidth={900}>
                        <Table
                          striped
                          highlightOnHover
                          withTableBorder
                          withColumnBorders
                        >
                          <Table.Thead>
                            <Table.Tr>
                              <Table.Th>
                                Klasifikasi Hotel
                              </Table.Th>

                              <Table.Th ta="right">
                                TPK Sekarang
                              </Table.Th>

                              <Table.Th ta="right">
                                Bulan Sebelumnya
                              </Table.Th>

                              <Table.Th ta="right">
                                Tahun Sebelumnya
                              </Table.Th>

                              <Table.Th>
                                Perubahan Bulanan
                              </Table.Th>

                              <Table.Th>
                                Perubahan Tahunan
                              </Table.Th>
                            </Table.Tr>
                          </Table.Thead>

                          <Table.Tbody>
                            <Table.Tr>
                              <Table.Td fw={700}>
                                Total Hotel Bintang
                              </Table.Td>

                              <Table.Td ta="right">
                                {formatPreviewNumber(
                                  previewData.analytics.tpk
                                    .total.current,
                                  '%'
                                )}
                              </Table.Td>

                              <Table.Td ta="right">
                                {formatPreviewNumber(
                                  previewData.analytics.tpk
                                    .total.previousMonth,
                                  '%'
                                )}
                              </Table.Td>

                              <Table.Td ta="right">
                                {formatPreviewNumber(
                                  previewData.analytics.tpk
                                    .total.previousYear,
                                  '%'
                                )}
                              </Table.Td>

                              <Table.Td>
                                <ChangeValue
                                  value={
                                    previewData.analytics
                                      .tpk.total.mtmChange
                                  }
                                  status={
                                    previewData.analytics
                                      .tpk.total.mtmStatus
                                  }
                                  suffix=" poin"
                                />
                              </Table.Td>

                              <Table.Td>
                                <ChangeValue
                                  value={
                                    previewData.analytics
                                      .tpk.total.yoyChange
                                  }
                                  status={
                                    previewData.analytics
                                      .tpk.total.yoyStatus
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
                                <Table.Tr
                                  key={classification.key}
                                >
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
                                      value={
                                        classification.mtmChange
                                      }
                                      status={
                                        classification.mtmStatus
                                      }
                                      suffix=" poin"
                                    />
                                  </Table.Td>

                                  <Table.Td>
                                    <ChangeValue
                                      value={
                                        classification.yoyChange
                                      }
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
                  </Paper>
                </Tabs.Panel>

                <Tabs.Panel value="rlmt" pt="lg">
                  <Paper
                    withBorder
                    p={{
                      base: 'md',
                      sm: 'lg',
                    }}
                    shadow="xs"
                  >
                    <div>
                      <Title order={3} mb="md">
                        {
                          previewData.narrative.sections
                            .rlmt.title
                        }
                      </Title>

                      <Stack gap="sm" mb="lg"></Stack>

                      <Table.ScrollContainer minWidth={900}>
                        <Table
                          striped
                          highlightOnHover
                          withTableBorder
                          withColumnBorders
                        >
                          <Table.Thead>
                            <Table.Tr>
                              <Table.Th>
                                Jenis Tamu
                              </Table.Th>

                              <Table.Th ta="right">
                                RLMT Sekarang
                              </Table.Th>

                              <Table.Th ta="right">
                                Bulan Sebelumnya
                              </Table.Th>

                              <Table.Th ta="right">
                                Tahun Sebelumnya
                              </Table.Th>

                              <Table.Th>
                                Perubahan Bulanan
                              </Table.Th>

                              <Table.Th>
                                Perubahan Tahunan
                              </Table.Th>
                            </Table.Tr>
                          </Table.Thead>

                          <Table.Tbody>
                            <RlmtRow
                              label="Seluruh Tamu"
                              metric={
                                previewData.analytics.rlmt
                                  .total
                              }
                            />

                            <RlmtRow
                              label="Tamu Asing"
                              metric={
                                previewData.analytics.rlmt
                                  .asing
                              }
                            />

                            <RlmtRow
                              label="Tamu Nusantara"
                              metric={
                                previewData.analytics.rlmt
                                  .nusantara
                              }
                            />
                          </Table.Tbody>
                        </Table>
                      </Table.ScrollContainer>
                    </div>
                  </Paper>
                </Tabs.Panel>

                <Tabs.Panel value="data" pt="lg">
                  <Stack gap="lg">
                    <Paper
                      withBorder
                      p={{
                        base: 'md',
                        sm: 'lg',
                      }}
                      shadow="xs"
                    >
                      <div>
                        <Title order={3} mb={4}>
                          Perkembangan TPK Hotel Klasifikasi
                          Bintang
                        </Title>

                        <Text size="sm" c="dimmed" mb="lg">
                          Perkembangan Tingkat Penghunian
                          Kamar selama 13 bulan terakhir.
                        </Text>

                        <Table.ScrollContainer
                          minWidth={850}
                        >
                          <Table
                            striped
                            highlightOnHover
                            withTableBorder
                            withColumnBorders
                          >
                            <Table.Thead>
                              <Table.Tr>
                                <Table.Th>Periode</Table.Th>

                                <Table.Th ta="right">
                                  Total Bintang
                                </Table.Th>

                                <Table.Th ta="right">
                                  Bintang 1 dan 2
                                </Table.Th>

                                <Table.Th ta="right">
                                  Bintang 3
                                </Table.Th>

                                <Table.Th ta="right">
                                  Bintang 4
                                </Table.Th>

                                <Table.Th ta="right">
                                  Bintang 5
                                </Table.Th>
                              </Table.Tr>
                            </Table.Thead>

                            <Table.Tbody>
                              {previewData.analytics.history.map(
                                (period) => (
                                  <Table.Tr
                                    key={`${period.tahun}-${period.bulan}`}
                                  >
                                    <Table.Td fw={600}>
                                      {
                                        MONTH_NAMES[
                                          period.bulan
                                        ]
                                      }{' '}
                                      {period.tahun}
                                    </Table.Td>

                                    {!period.available ? (
                                      <Table.Td
                                        colSpan={5}
                                        ta="center"
                                      >
                                        <Text
                                          size="sm"
                                          c="dimmed"
                                        >
                                          Data belum
                                          tersedia
                                        </Text>
                                      </Table.Td>
                                    ) : (
                                      <>
                                        <Table.Td ta="right">
                                          {formatPreviewNumber(
                                            period.tpkTotal,
                                            '%'
                                          )}
                                        </Table.Td>

                                        <Table.Td ta="right">
                                          {formatPreviewNumber(
                                            getClassificationValue(
                                              period.tpkClassifications,
                                              'BINTANG_1_2'
                                            ),
                                            '%'
                                          )}
                                        </Table.Td>

                                        <Table.Td ta="right">
                                          {formatPreviewNumber(
                                            getClassificationValue(
                                              period.tpkClassifications,
                                              'BINTANG_3'
                                            ),
                                            '%'
                                          )}
                                        </Table.Td>

                                        <Table.Td ta="right">
                                          {formatPreviewNumber(
                                            getClassificationValue(
                                              period.tpkClassifications,
                                              'BINTANG_4'
                                            ),
                                            '%'
                                          )}
                                        </Table.Td>

                                        <Table.Td ta="right">
                                          {formatPreviewNumber(
                                            getClassificationValue(
                                              period.tpkClassifications,
                                              'BINTANG_5'
                                            ),
                                            '%'
                                          )}
                                        </Table.Td>
                                      </>
                                    )}
                                  </Table.Tr>
                                )
                              )}
                            </Table.Tbody>
                          </Table>
                        </Table.ScrollContainer>
                      </div>
                    </Paper>

                    <Paper
                      withBorder
                      p={{
                        base: 'md',
                        sm: 'lg',
                      }}
                      shadow="xs"
                    >
                      <div>
                        <Title order={3} mb={4}>
                          Perkembangan Rata-Rata Lama
                          Menginap Tamu
                        </Title>

                        <Text size="sm" c="dimmed" mb="lg">
                          Perkembangan rata-rata lama
                          menginap tamu selama 13 bulan
                          terakhir.
                        </Text>

                        <Table.ScrollContainer
                          minWidth={700}
                        >
                          <Table
                            striped
                            highlightOnHover
                            withTableBorder
                            withColumnBorders
                          >
                            <Table.Thead>
                              <Table.Tr>
                                <Table.Th>Periode</Table.Th>

                                <Table.Th ta="right">
                                  Seluruh Tamu
                                </Table.Th>

                                <Table.Th ta="right">
                                  Tamu Asing
                                </Table.Th>

                                <Table.Th ta="right">
                                  Tamu Nusantara
                                </Table.Th>
                              </Table.Tr>
                            </Table.Thead>

                            <Table.Tbody>
                              {previewData.analytics.history.map(
                                (period) => (
                                  <Table.Tr
                                    key={`rlmt-${period.tahun}-${period.bulan}`}
                                  >
                                    <Table.Td fw={600}>
                                      {
                                        MONTH_NAMES[
                                          period.bulan
                                        ]
                                      }{' '}
                                      {period.tahun}
                                    </Table.Td>

                                    {!period.available ? (
                                      <Table.Td
                                        colSpan={3}
                                        ta="center"
                                      >
                                        <Text
                                          size="sm"
                                          c="dimmed"
                                        >
                                          Data belum
                                          tersedia
                                        </Text>
                                      </Table.Td>
                                    ) : (
                                      <>
                                        <Table.Td ta="right">
                                          {formatPreviewNumber(
                                            period.rlmtTotal,
                                            ' hari'
                                          )}
                                        </Table.Td>

                                        <Table.Td ta="right">
                                          {formatPreviewNumber(
                                            period.rlmtAsing,
                                            ' hari'
                                          )}
                                        </Table.Td>

                                        <Table.Td ta="right">
                                          {formatPreviewNumber(
                                            period.rlmtNusantara,
                                            ' hari'
                                          )}
                                        </Table.Td>
                                      </>
                                    )}
                                  </Table.Tr>
                                )
                              )}
                            </Table.Tbody>
                          </Table>
                        </Table.ScrollContainer>
                      </div>
                    </Paper>
                  </Stack>
                </Tabs.Panel>
              </Tabs>
            )}
          </Tabs.Panel>

          <Tabs.Panel value="dokumen" pt="lg">
            <Paper
              withBorder
              p={{
                base: 'md',
                sm: 'lg',
              }}
              shadow="xs"
              style={{
                borderTop:
                  '4px solid var(--mantine-color-bpsBlue-6)',
              }}
            >
              <Group
                justify="space-between"
                align="flex-start"
                mb="lg"
              >
                <Group align="flex-start" wrap="nowrap">
                  <ThemeIcon
                    color="bpsBlue"
                    variant="light"
                    size={46}
                    radius="md"
                  >
                    <IconFileSpreadsheet
                      size={25}
                      stroke={1.8}
                    />
                  </ThemeIcon>

                  <div>
                    <Title order={4}>
                      Sumber Data dan Draft
                    </Title>

                    <Text size="sm" c="dimmed">
                      Excel aktif yang digunakan untuk
                      menghasilkan draft BRS.
                    </Text>
                  </div>
                </Group>

                {activeExcel && (
                  <Badge
                    color="bpsGreen"
                    variant="light"
                    size="lg"
                    leftSection={
                      <IconCircleCheck size={14} />
                    }
                  >
                    Data Tersedia
                  </Badge>
                )}
              </Group>

              {!activeExcel ? (
                <Alert
                  color="bpsOrange"
                  title="Data belum tersedia"
                  icon={<IconAlertTriangle size={20} />}
                >
                  BRS ini belum mempunyai data Excel aktif.
                </Alert>
              ) : (
                <Stack gap="lg">
                  <SimpleGrid
                    cols={{
                      base: 1,
                      sm: 2,
                      lg: 3,
                    }}
                  >
                    <MetadataCard
                      icon={IconFileSpreadsheet}
                      color="bpsBlue"
                      label="File Excel"
                      value={activeExcel.originalName}
                    />

                    <MetadataCard
                      icon={IconTable}
                      color="bpsGreen"
                      label="Jumlah Data"
                      value={`${activeExcel.rowCount} baris`}
                    />

                    <MetadataCard
                      icon={IconCalendarEvent}
                      color="bpsOrange"
                      label="Tanggal Upload"
                      value={formatDate(
                        activeExcel.uploadedAt
                      )}
                    />
                  </SimpleGrid>

                  <Paper withBorder p="md" bg="gray.0">
                    <Text
                      size="xs"
                      fw={700}
                      c="dimmed"
                      tt="uppercase"
                      mb="sm"
                    >
                      Aksi Dokumen
                    </Text>

                    <SimpleGrid
                      cols={{
                        base: 1,
                        sm:
                          brs.status === 'DRAFT' && isKetua
                            ? 3
                            : 2,
                      }}
                    >
                      <Button
                        variant="light"
                        color="bpsBlue"
                        leftSection={
                          <IconDownload size={18} />
                        }
                        loading={actionLoading}
                        onClick={() => {
                          void handleDownloadExcel();
                        }}
                      >
                        Unduh Excel
                      </Button>

                      <Button
                        variant="light"
                        color="bpsOrange"
                        leftSection={
                          <IconFileTypeDocx size={18} />
                        }
                        loading={actionLoading}
                        onClick={() => {
                          void handleDownloadDraft();
                        }}
                      >
                        Unduh Draft Word
                      </Button>

                      {brs.status === 'DRAFT' &&
                        isKetua && (
                          <Button
                            color="bpsGreen"
                            leftSection={
                              <IconCircleCheck size={18} />
                            }
                            loading={actionLoading}
                            onClick={() => {
                              void handleMarkDraftReady();
                            }}
                          >
                            Tetapkan Draft Siap
                          </Button>
                        )}
                    </SimpleGrid>
                  </Paper>

                  {brs.status === 'DRAFT_READY' && (
                    <Alert
                      color="bpsBlue"
                      title="Draft sudah siap"
                      icon={<IconCircleCheck size={20} />}
                    >
                      Petugas Pengelola sudah dapat
                      mengunggah calon PDF BRS final.
                    </Alert>
                  )}

                  {brs.status === 'FINAL_REJECTED' && (
                    <Alert
                      color="red"
                      title="BRS memerlukan perbaikan"
                      icon={<IconAlertTriangle size={20} />}
                    >
                      Draft Word dapat diunduh kembali
                      sebagai dasar perbaikan calon BRS
                      final.
                    </Alert>
                  )}

                  {brs.status === 'FINAL' && (
                    <Alert
                      color="bpsGreen"
                      title="Proses penyusunan selesai"
                      icon={<IconCircleCheck size={20} />}
                    >
                      Data Excel dan draft ini menjadi
                      sumber BRS final yang telah disetujui.
                    </Alert>
                  )}
                </Stack>
              )}
            </Paper>
            {isPengelola &&
              (brs.status === 'DRAFT_READY' ||
                brs.status === 'FINAL_REJECTED') && (
                <Paper
                  withBorder
                  p={{
                    base: 'md',
                    sm: 'lg',
                  }}
                  shadow="xs"
                  style={{
                    borderTop:
                      '4px solid var(--mantine-color-bpsOrange-6)',
                  }}
                >
                  <Group
                    justify="space-between"
                    align="flex-start"
                    mb="lg"
                  >
                    <Group align="flex-start" wrap="nowrap">
                      <ThemeIcon
                        color="bpsOrange"
                        variant="light"
                        size={46}
                        radius="md"
                      >
                        <IconUpload
                          size={25}
                          stroke={1.8}
                        />
                      </ThemeIcon>

                      <div>
                        <Title order={4}>
                          Unggah Calon BRS Final
                        </Title>

                        <Text size="sm" c="dimmed">
                          Unggah PDF yang sudah diperbaiki
                          untuk diperiksa oleh Ketua BRS.
                        </Text>
                      </div>
                    </Group>

                    <Badge
                      color="bpsOrange"
                      variant="light"
                      size="lg"
                    >
                      Tugas Pengelola
                    </Badge>
                  </Group>

                  {brs.status === 'FINAL_REJECTED' &&
                    latestRejected && (
                      <Alert
                        color="red"
                        title="Perbaikan diperlukan"
                        icon={
                          <IconAlertTriangle size={20} />
                        }
                        mb="lg"
                      >
                        <Text fw={500}>
                          {latestRejected.note ??
                            'Tidak ada catatan penolakan.'}
                        </Text>

                        <Text size="xs" c="dimmed" mt={6}>
                          Ditolak oleh{' '}
                          {latestRejected.reviewedBy.name}
                          {' pada '}
                          {formatDateTime(
                            latestRejected.reviewedAt
                          )}
                        </Text>
                      </Alert>
                    )}

                  <Paper withBorder p="md" bg="gray.0">
                    <Stack gap="md">
                      <FileInput
                        label="File calon BRS final"
                        description="Format PDF dengan ukuran maksimal 20 MB"
                        placeholder="Pilih file PDF"
                        accept="application/pdf,.pdf"
                        value={finalFile}
                        onChange={setFinalFile}
                        leftSection={
                          <IconFileTypePdf size={18} />
                        }
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
                          leftSection={
                            <IconHash size={18} />
                          }
                          onChange={(event) => {
                            setNomorBrs(
                              event.currentTarget.value
                            );
                          }}
                          required
                        />

                        <TextInput
                          type="date"
                          label="Tanggal publikasi"
                          value={tanggalPublikasi}
                          leftSection={
                            <IconCalendarEvent size={18} />
                          }
                          onChange={(event) => {
                            setTanggalPublikasi(
                              event.currentTarget.value
                            );
                          }}
                        />
                      </SimpleGrid>

                      <Group justify="flex-end">
                        <Button
                          color="bpsOrange"
                          leftSection={
                            <IconSend size={18} />
                          }
                          loading={actionLoading}
                          disabled={
                            !finalFile || !nomorBrs.trim()
                          }
                          onClick={() => {
                            void handleSubmitFinal();
                          }}
                        >
                          Kirim untuk Review
                        </Button>
                      </Group>
                    </Stack>
                  </Paper>
                </Paper>
              )}
            {brs.status === 'FINAL_SUBMITTED' &&
              brs.finalSubmission && (
                <Paper
                  withBorder
                  p={{
                    base: 'md',
                    sm: 'lg',
                  }}
                  shadow="xs"
                  style={{
                    borderTop:
                      '4px solid var(--mantine-color-bpsOrange-6)',
                  }}
                >
                  <Group
                    justify="space-between"
                    align="flex-start"
                    mb="lg"
                  >
                    <Group align="flex-start" wrap="nowrap">
                      <ThemeIcon
                        color="bpsOrange"
                        variant="light"
                        size={46}
                        radius="md"
                      >
                        <IconEye size={25} stroke={1.8} />
                      </ThemeIcon>

                      <div>
                        <Title order={4}>
                          Review Calon BRS Final
                        </Title>

                        <Text size="sm" c="dimmed">
                          Periksa identitas dan isi PDF
                          sebelum memberikan keputusan.
                        </Text>
                      </div>
                    </Group>

                    <Badge
                      color="bpsOrange"
                      variant="light"
                      size="lg"
                    >
                      Versi {brs.finalSubmission.version}
                    </Badge>
                  </Group>

                  <SimpleGrid
                    cols={{
                      base: 1,
                      sm: 2,
                      lg: 4,
                    }}
                    mb="lg"
                  >
                    <MetadataCard
                      icon={IconFileTypePdf}
                      color="bpsOrange"
                      label="File PDF"
                      value={
                        brs.finalSubmission.originalName
                      }
                    />

                    <MetadataCard
                      icon={IconHash}
                      color="bpsBlue"
                      label="Nomor BRS"
                      value={
                        brs.finalSubmission.proposedNomorBrs
                      }
                    />

                    <MetadataCard
                      icon={IconCalendarEvent}
                      color="bpsGreen"
                      label="Tanggal Publikasi"
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

                    <MetadataCard
                      icon={IconUser}
                      color="bpsBlue"
                      label="Diajukan Oleh"
                      value={
                        brs.finalSubmission.submittedBy.name
                      }
                    />
                  </SimpleGrid>

                  <Paper withBorder p="md" bg="gray.0">
                    <Text
                      size="xs"
                      fw={700}
                      c="dimmed"
                      tt="uppercase"
                      mb="sm"
                    >
                      Aksi Pengajuan
                    </Text>

                    <SimpleGrid
                      cols={{
                        base: 1,
                        sm: 2,
                        lg: isKetua ? 4 : 2,
                      }}
                    >
                      <Button
                        variant="light"
                        color="bpsBlue"
                        leftSection={<IconEye size={18} />}
                        disabled={actionLoading}
                        onClick={handlePreviewPending}
                      >
                        Preview PDF
                      </Button>

                      <Button
                        variant="light"
                        color="bpsBlue"
                        leftSection={
                          <IconDownload size={18} />
                        }
                        loading={actionLoading}
                        onClick={() => {
                          void handleDownloadPending();
                        }}
                      >
                        Unduh PDF
                      </Button>

                      {isKetua && (
                        <>
                          <Button
                            color="red"
                            variant="light"
                            leftSection={
                              <IconCircleX size={18} />
                            }
                            disabled={actionLoading}
                            onClick={rejectModal.open}
                          >
                            Tolak
                          </Button>

                          <Button
                            color="bpsGreen"
                            leftSection={
                              <IconCircleCheck size={18} />
                            }
                            loading={actionLoading}
                            onClick={() => {
                              void handleApprove();
                            }}
                          >
                            Setujui
                          </Button>
                        </>
                      )}
                    </SimpleGrid>
                  </Paper>

                  {!isKetua && (
                    <Alert
                      color="bpsOrange"
                      title="Menunggu keputusan Ketua BRS"
                      icon={<IconClock size={20} />}
                      mt="lg"
                    >
                      Calon PDF sudah berhasil dikirim dan
                      sedang menunggu pemeriksaan Ketua BRS.
                    </Alert>
                  )}
                </Paper>
              )}

            {brs.status === 'FINAL' && brs.finalFile && (
              <Paper
                withBorder
                p={{
                  base: 'md',
                  sm: 'lg',
                }}
                shadow="sm"
                style={{
                  borderTop:
                    '4px solid var(--mantine-color-bpsGreen-6)',

                  background:
                    'linear-gradient(135deg, var(--mantine-color-bpsGreen-0), white)',
                }}
              >
                <Group
                  justify="space-between"
                  align="flex-start"
                  mb="lg"
                >
                  <Group align="flex-start" wrap="nowrap">
                    <ThemeIcon
                      color="bpsGreen"
                      variant="filled"
                      size={50}
                      radius="xl"
                      flex="0 0 auto"
                    >
                      <IconFileCheck
                        size={28}
                        stroke={1.8}
                      />
                    </ThemeIcon>

                    <div>
                      <Text
                        size="xs"
                        fw={700}
                        c="bpsGreen.8"
                        tt="uppercase"
                      >
                        Dokumen Resmi
                      </Text>

                      <Title order={3}>BRS Final</Title>

                      <Text size="sm" c="dimmed" mt={2}>
                        Dokumen telah diperiksa dan
                        disetujui oleh Ketua BRS.
                      </Text>
                    </div>
                  </Group>

                  <Badge
                    color="bpsGreen"
                    variant="filled"
                    size="lg"
                    leftSection={
                      <IconCircleCheck size={14} />
                    }
                  >
                    Disetujui
                  </Badge>
                </Group>

                <SimpleGrid
                  cols={{
                    base: 1,
                    sm: 2,
                    lg: 4,
                  }}
                  mb="lg"
                >
                  <MetadataCard
                    icon={IconFileTypePdf}
                    color="bpsGreen"
                    label="File BRS Final"
                    value={brs.finalFile.originalName}
                  />

                  <MetadataCard
                    icon={IconHash}
                    color="bpsBlue"
                    label="Nomor BRS"
                    value={
                      brs.nomorBrs ?? 'Belum ditetapkan'
                    }
                  />

                  <MetadataCard
                    icon={IconCalendarEvent}
                    color="bpsOrange"
                    label="Tanggal Publikasi"
                    value={
                      brs.tanggalPublikasi
                        ? formatDate(brs.tanggalPublikasi)
                        : 'Belum ditetapkan'
                    }
                  />

                  <MetadataCard
                    icon={IconUser}
                    color="bpsBlue"
                    label="Disetujui Oleh"
                    value={brs.finalFile.approvedBy.name}
                  />
                </SimpleGrid>

                <Paper withBorder p="md" bg="white">
                 <Stack gap="md">
                    <Group gap="xs">
                      <IconCircleCheck
                        size={18}
                        color="var(--mantine-color-bpsGreen-7)"
                      />

                      <Text size="sm" c="dimmed">
                        PDF ini merupakan dokumen BRS final
                        yang tersimpan permanen.
                      </Text>
                    </Group>

                    <Group>
                      <Button
                        variant="light"
                        color="bpsGreen"
                        leftSection={<IconEye size={18} />}
                        disabled={actionLoading}
                        onClick={handlePreviewFinal}
                      >
                        Preview BRS Final
                      </Button>

                      <Button
                        color="bpsGreen"
                        leftSection={
                          <IconDownload size={18} />
                        }
                        loading={actionLoading}
                        onClick={() => {
                          void handleDownloadFinal();
                        }}
                      >
                        Unduh BRS Final
                      </Button>
                    </Group>
                  </Stack>
                </Paper>
              </Paper>
            )}

            {brs.status === 'FINAL' && !brs.finalFile && (
              <Alert
                color="red"
                title="File final tidak ditemukan"
                icon={<IconAlertTriangle size={20} />}
              >
                Status BRS sudah final, tetapi informasi PDF
                final tidak tersedia. Periksa data file
                final pada server.
              </Alert>
            )}
          </Tabs.Panel>
          <Tabs.Panel value="review" pt="lg">
            <Paper
              withBorder
              p={{
                base: 'md',
                sm: 'lg',
              }}
              shadow="xs"
              style={{
                borderTop:
                  '4px solid var(--mantine-color-bpsBlue-6)',
              }}
            >
              <Group
                justify="space-between"
                align="flex-start"
                mb="lg"
              >
                <Group align="flex-start" wrap="nowrap">
                  <ThemeIcon
                    color="bpsBlue"
                    variant="light"
                    size={44}
                  >
                    <IconHistory size={24} />
                  </ThemeIcon>

                  <div>
                    <Title order={4}>
                      Riwayat Review BRS Final
                    </Title>

                    <Text size="sm" c="dimmed">
                      Riwayat persetujuan dan penolakan
                      calon BRS final.
                    </Text>
                  </div>
                </Group>

                <Badge
                  color="bpsBlue"
                  variant="light"
                  size="lg"
                >
                  {brs.reviewHistories.length} Review
                </Badge>
              </Group>

              {brs.reviewHistories.length === 0 ? (
                <Alert
                  color="bpsOrange"
                  title="Belum ada riwayat review"
                  icon={<IconHistory size={20} />}
                >
                  Pengajuan BRS final belum pernah disetujui
                  atau ditolak oleh Ketua BRS.
                </Alert>
              ) : (
                <Table.ScrollContainer minWidth={900}>
                  <Table
                    striped
                    highlightOnHover
                    withTableBorder
                    withColumnBorders
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
                        (history) => {
                          const approved =
                            history.decision === 'APPROVED';

                          return (
                            <Table.Tr key={history.id}>
                              <Table.Td>
                                <Badge
                                  color="gray"
                                  variant="light"
                                >
                                  Versi{' '}
                                  {
                                    history.submissionVersion
                                  }
                                </Badge>
                              </Table.Td>

                              <Table.Td>
                                <Text
                                  fw={500}
                                  lineClamp={1}
                                >
                                  {history.originalName}
                                </Text>
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
                                    approved
                                      ? 'bpsGreen'
                                      : 'red'
                                  }
                                  variant="light"
                                  leftSection={
                                    approved ? (
                                      <IconCircleCheck
                                        size={13}
                                      />
                                    ) : (
                                      <IconCircleX
                                        size={13}
                                      />
                                    )
                                  }
                                >
                                  {approved
                                    ? 'Disetujui'
                                    : 'Ditolak'}
                                </Badge>
                              </Table.Td>

                              <Table.Td>
                                <Text
                                  size="sm"
                                  c={
                                    history.note
                                      ? undefined
                                      : 'dimmed'
                                  }
                                >
                                  {history.note ??
                                    'Tidak ada catatan'}
                                </Text>
                              </Table.Td>

                              <Table.Td>
                                <Text size="sm">
                                  {formatDateTime(
                                    history.reviewedAt
                                  )}
                                </Text>
                              </Table.Td>
                            </Table.Tr>
                          );
                        }
                      )}
                    </Table.Tbody>
                  </Table>
                </Table.ScrollContainer>
              )}
            </Paper>
          </Tabs.Panel>
        </Tabs>
      </Stack>
      {isKetua && (
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
      )}
    </Container>
  );
}
interface RlmtRowProps {
  label: string;
  metric: MetricComparison;
}

function RlmtRow({ label, metric }: RlmtRowProps) {
  return (
    <Table.Tr>
      <Table.Td
        fw={label === 'Seluruh Tamu' ? 700 : undefined}
      >
        {label}
      </Table.Td>

      <Table.Td ta="right">
        {formatPreviewNumber(metric.current, ' hari')}
      </Table.Td>

      <Table.Td ta="right">
        {formatPreviewNumber(metric.previousMonth, ' hari')}
      </Table.Td>

      <Table.Td ta="right">
        {formatPreviewNumber(metric.previousYear, ' hari')}
      </Table.Td>

      <Table.Td>
        <ChangeValue
          value={metric.mtmChange}
          status={metric.mtmStatus}
          suffix=" hari"
        />
      </Table.Td>

      <Table.Td>
        <ChangeValue
          value={metric.yoyChange}
          status={metric.yoyStatus}
          suffix=" hari"
        />
      </Table.Td>
    </Table.Tr>
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
  icon: ComponentType<{
    size?: number | string;
    stroke?: number;
  }>;
  color: BrsColor;
  label: string;
  value: string;
}

interface PreviewOverviewProps {
  brs: BrsDetail;
  preview: BrsPreviewData | null;
}

function PreviewOverview({
  brs,
  preview,
}: PreviewOverviewProps) {
  const isReady = preview?.narrative.readyForFinal ?? false;

  return (
    <Paper
      withBorder
      p={{
        base: 'md',
        sm: 'xl',
      }}
      mb="lg"
      shadow="xs"
      style={{
        borderTop:
          '4px solid var(--mantine-color-bpsBlue-6)',
      }}
    >
      <Group
        justify="space-between"
        align="flex-start"
        mb="xl"
      >
        <Group align="flex-start" wrap="nowrap">
          <ThemeIcon
            color="bpsBlue"
            variant="light"
            size={48}
            radius="md"
            flex="0 0 auto"
          >
            <IconEye size={26} stroke={1.8} />
          </ThemeIcon>

          <div>
            <Text
              size="sm"
              fw={700}
              c="bpsBlue.7"
              tt="uppercase"
            >
              Preview BRS
            </Text>

            <Title order={2}>
              Perkembangan Pariwisata Kota Samarinda
            </Title>

            <Text size="lg" c="dimmed" mt={2}>
              {preview
                ? preview.narrative.period.label
                : `${MONTH_NAMES[brs.bulan]} ${brs.tahun}`}
            </Text>
          </div>
        </Group>

        {preview && (
          <Badge
            color={isReady ? 'bpsGreen' : 'bpsOrange'}
            variant="light"
            size="lg"
            leftSection={
              isReady ? (
                <IconCircleCheck size={14} />
              ) : (
                <IconAlertTriangle size={14} />
              )
            }
          >
            {isReady
              ? 'Data 13 Bulan Lengkap'
              : `${preview.analytics.availability.historyMonthsAvailable}/${preview.analytics.availability.historyMonthsRequired} Bulan`}
          </Badge>
        )}
      </Group>

      {preview === null ? (
        <Alert
          color="bpsOrange"
          title="Preview belum tersedia"
          icon={<IconAlertTriangle size={20} />}
        >
          Data preview BRS belum dapat ditampilkan.
        </Alert>
      ) : (
        <Stack gap="lg">
          {preview.narrative.warnings.length > 0 && (
            <Alert
              color="bpsOrange"
              title="Kelengkapan data"
              icon={<IconAlertTriangle size={20} />}
            >
              <Stack gap={4}>
                {preview.narrative.warnings.map(
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
            <Group mb="md" wrap="nowrap">
              <ThemeIcon
                color="bpsGreen"
                variant="light"
                size={38}
              >
                <IconInfoCircle size={21} />
              </ThemeIcon>

              <div>
                <Title order={3}>Ringkasan Utama</Title>

                <Text size="sm" c="dimmed">
                  Poin utama perkembangan pariwisata pada
                  periode ini.
                </Text>
              </div>
            </Group>

            {preview.narrative.highlights.length === 0 ? (
              <Text c="dimmed">
                Ringkasan utama belum tersedia.
              </Text>
            ) : (
              <SimpleGrid
                cols={{
                  base: 1,
                  md: 2,
                }}
              >
                {preview.narrative.highlights.map(
                  (highlight, index) => (
                    <Paper
                      key={`${highlight}-${index}`}
                      withBorder
                      p="md"
                      bg="bpsBlue.0"
                      style={{
                        borderLeft:
                          '4px solid var(--mantine-color-bpsBlue-6)',
                      }}
                    >
                      <Group
                        align="flex-start"
                        wrap="nowrap"
                      >
                        <ThemeIcon
                          color="bpsBlue"
                          variant="light"
                          size={30}
                          radius="xl"
                          flex="0 0 auto"
                        >
                          <IconInfoCircle size={17} />
                        </ThemeIcon>

                        <Text size="sm" lh={1.6}>
                          {highlight}
                        </Text>
                      </Group>
                    </Paper>
                  )
                )}
              </SimpleGrid>
            )}
          </div>
        </Stack>
      )}
    </Paper>
  );
}

function IndicatorCard({
  icon: Icon,
  color,
  label,
  value,
}: IndicatorCardProps) {
  return (
    <Paper
      withBorder
      p="md"
      h="100%"
      shadow="xs"
      style={{
        borderTop: `4px solid var(--mantine-color-${color}-6)`,
      }}
    >
      <Group align="flex-start" wrap="nowrap">
        <ThemeIcon
          color={color}
          variant="light"
          size={42}
          radius="md"
          flex="0 0 auto"
        >
          <Icon size={23} stroke={1.8} />
        </ThemeIcon>

        <div>
          <Text size="sm" c="dimmed" lh={1.25}>
            {label}
          </Text>

          <Text fw={750} fz={24} mt={5} lh={1.2}>
            {value}
          </Text>
        </div>
      </Group>
    </Paper>
  );
}
interface InfoProps {
  label: string;
  value: string;
}

type BrsColor = 'bpsBlue' | 'bpsGreen' | 'bpsOrange';

interface MetadataCardProps {
  icon: ComponentType<{
    size?: number | string;
    stroke?: number;
  }>;
  color: BrsColor;
  label: string;
  value: string;
}

function MetadataCard({
  icon: Icon,
  color,
  label,
  value,
}: MetadataCardProps) {
  return (
    <Paper
      withBorder
      p="md"
      bg={`${color}.0`}
      h="100%"
      style={{
        borderColor: `var(--mantine-color-${color}-2)`,
      }}
    >
      <Group align="flex-start" wrap="nowrap">
        <ThemeIcon
          color={color}
          variant="light"
          size={38}
          radius="md"
          flex="0 0 auto"
        >
          <Icon size={20} stroke={1.8} />
        </ThemeIcon>

        <div>
          <Text size="xs" c="dimmed">
            {label}
          </Text>

          <Text fw={650} mt={3}>
            {value}
          </Text>
        </div>
      </Group>
    </Paper>
  );
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

function getClassificationValue(
  classifications: Array<{
    key: string;
    label: string;
    value: number | null;
  }>,
  key: string
) {
  return (
    classifications.find(
      (classification) => classification.key === key
    )?.value ?? null
  );
}
