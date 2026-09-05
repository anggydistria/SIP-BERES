'use client';

import {
  Alert,
  Badge,
  Button,
  Group,
  Paper,
  Select,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { useEffect, useState } from 'react';
import { getBrsPreview } from '@/lib/api/brs-preview';
import type { Brs } from '@/types/brs';
import type {
  BrsAnalytics,
  BrsHistoryPeriod,
  ChangeStatus,
  MetricComparison,
  ClassificationComparison,
} from '@/types/brs-preview';
import { getDashboardSummary } from '@/lib/api/dashboard';
import type { DashboardSummary } from '@/types/dashboard';

import { TourismTrendCharts } from '@/components/dashboard/TourismTrendCharts';
import { getBrsList } from '@/lib/api/brs';
const MONTH_OPTIONS = [
  { value: '1', label: 'Januari' },
  { value: '2', label: 'Februari' },
  { value: '3', label: 'Maret' },
  { value: '4', label: 'April' },
  { value: '5', label: 'Mei' },
  { value: '6', label: 'Juni' },
  { value: '7', label: 'Juli' },
  { value: '8', label: 'Agustus' },
  { value: '9', label: 'September' },
  { value: '10', label: 'Oktober' },
  { value: '11', label: 'November' },
  { value: '12', label: 'Desember' },
];

const integerFormatter = new Intl.NumberFormat('id-ID');

const decimalFormatter = new Intl.NumberFormat('id-ID', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function DashboardView() {
  const [availablePeriods, setAvailablePeriods] = useState<
    Brs[]
  >([]);
  const [month, setMonth] = useState('');

  const [year, setYear] = useState('');

  const [availableYears, setAvailableYears] = useState<
    string[]
  >([]);

  const [summary, setSummary] =
    useState<DashboardSummary | null>(null);
  const [analytics, setAnalytics] =
    useState<BrsAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [downloadError, setDownloadError] = useState<
    string | null
  >(null);

  useEffect(() => {
    let isCancelled = false;

    getBrsList({
      page: 1,
      limit: 100,
    })
      .then(async (response) => {
        const latestBrs = response.data[0];
        const years = Array.from(
          new Set(
            response.data.map((brs) => String(brs.tahun))
          )
        ).sort(
          (first, second) => Number(second) - Number(first)
        );

        if (!latestBrs) {
          throw new Error(
            'Belum ada periode BRS yang tersedia'
          );
        }

        const [summaryResult, previewResult] =
          await Promise.all([
            getDashboardSummary(
              latestBrs.bulan,
              latestBrs.tahun
            ),

            getBrsPreview(latestBrs.bulan, latestBrs.tahun),
          ]);

        if (isCancelled) {
          return;
        }

        setMonth(String(latestBrs.bulan));

        setYear(String(latestBrs.tahun));

        setAvailableYears(years);

        setSummary(summaryResult);

        setAnalytics(previewResult.analytics);
        setAvailablePeriods(response.data);

        setError(null);
      })
      .catch((caughtError: unknown) => {
        if (isCancelled) {
          return;
        }

        setSummary(null);
        setAnalytics(null);

        setError(
          caughtError instanceof Error
            ? caughtError.message
            : 'Gagal mengambil data dashboard'
        );
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  async function loadSummary(
    selectedMonth: number,
    selectedYear: number
  ) {
    setIsLoading(true);
    setError(null);

    try {
      const [summaryResult, previewResult] =
        await Promise.all([
          getDashboardSummary(selectedMonth, selectedYear),

          getBrsPreview(selectedMonth, selectedYear),
        ]);

      setSummary(summaryResult);
      setAnalytics(previewResult.analytics);
    } catch (caughtError) {
      setSummary(null);
      setAnalytics(null);

      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Gagal mengambil data dashboard'
      );
    } finally {
      setIsLoading(false);
    }
  }

  function handleFilter() {
    const selectedMonth = Number(month);
    const selectedYear = Number(year);
    if (
      !Number.isInteger(selectedYear) ||
      !availableYears.includes(String(selectedYear))
    ) {
      setError('Tahun tidak tersedia');

      return;
    }

    if (
      !Number.isInteger(selectedMonth) ||
      selectedMonth < 1 ||
      selectedMonth > 12
    ) {
      setError('Bulan tidak valid');
      return;
    }

    if (
      !Number.isInteger(selectedYear) ||
      selectedYear < 2000
    ) {
      setError('Tahun tidak valid');
      return;
    }

    void loadSummary(selectedMonth, selectedYear);
  }

  const availableMonthOptions = MONTH_OPTIONS.filter(
    (option) =>
      availablePeriods.some(
        (brs) =>
          String(brs.tahun) === year &&
          String(brs.bulan) === option.value
      )
  );
  function handleYearChange(value: string | null) {
    const selectedYear = value ?? '';

    setYear(selectedYear);

    const latestPeriodInYear = availablePeriods.find(
      (brs) => String(brs.tahun) === selectedYear
    );

    setMonth(
      latestPeriodInYear
        ? String(latestPeriodInYear.bulan)
        : ''
    );
  }
  return (
    <Stack gap="lg">
      <div>
        <Title order={2}>Dashboard Pariwisata</Title>

        <Text c="dimmed" mt={4}>
          Ringkasan indikator perkembangan pariwisata Kota
          Samarinda.
        </Text>
      </div>

      <Paper withBorder p="md" radius="md">
        <Group align="end">
          <Select
            label="Bulan"
            placeholder="Pilih bulan"
            data={availableMonthOptions}
            value={month}
            onChange={(value) => {
              setMonth(value ?? '');
            }}
            allowDeselect={false}
            w={180}
          />
          <Select
            label="Tahun"
            placeholder="Pilih tahun"
            data={availableYears}
            value={year}
            onChange={handleYearChange}
            allowDeselect={false}
            w={140}
          />

          <Button
            onClick={handleFilter}
            loading={isLoading}
          >
            Tampilkan
          </Button>
        </Group>
      </Paper>

      {error && (
        <Alert color="red" title="Data tidak tersedia">
          {error}
        </Alert>
      )}

      {isLoading && <DashboardSkeleton />}

      {!isLoading && summary && (
        <>
          <Group justify="space-between" align="center">
            <div>
              <Text fw={600}>
                Periode{' '}
                {
                  MONTH_OPTIONS.find(
                    (item) =>
                      item.value ===
                      String(summary.brs.bulan)
                  )?.label
                }{' '}
                {summary.brs.tahun}
              </Text>

              <Text size="sm" c="dimmed">
                {summary.dataUpload.originalName}
              </Text>
            </div>
            <Badge color="green" variant="light">
              {summary.dataUpload.rowCount} baris
            </Badge>
          </Group>

          <SimpleGrid
            cols={{
              base: 1,
              sm: 2,
              lg: 4,
            }}
          >
            <IndicatorCard
              label="Malam kamar tersedia"
              value={integerFormatter.format(
                summary.indicators.malamKamarTersedia
              )}
              description="Total MKTS"
            />

            <IndicatorCard
              label="Malam kamar terjual"
              value={integerFormatter.format(
                summary.indicators.malamKamarTerjual
              )}
              description="Total MKTJ"
            />

            <IndicatorCard
              label="Tamu asing"
              value={integerFormatter.format(
                summary.indicators.tamuAsing
              )}
              description="Jumlah tamu asing"
            />

            <IndicatorCard
              label="Tamu nusantara"
              value={integerFormatter.format(
                summary.indicators.tamuNusantara
              )}
              description="Jumlah tamu nusantara"
            />

            <IndicatorCard
              label="Tingkat penghunian kamar"
              value={`${decimalFormatter.format(
                summary.indicators.tingkatPenghunianKamar
              )}%`}
              description="MKTJ ÷ MKTS × 100"
            />

            <IndicatorCard
              label="Rata-rata lama menginap"
              value={decimalFormatter.format(
                summary.indicators.rataLamaMenginap
              )}
              description="Gabungan seluruh tamu"
            />

            <IndicatorCard
              label="RLM tamu asing"
              value={formatNullableNumber(
                summary.indicators.rataLamaMenginapAsing
              )}
              description="Malam tamu asing ÷ tamu asing"
            />

            <IndicatorCard
              label="RLM tamu nusantara"
              value={formatNullableNumber(
                summary.indicators.rataLamaMenginapNusantara
              )}
              description="Malam tamu nusantara ÷ tamu nusantara"
            />
          </SimpleGrid>
          {analytics && (
            <div>
              <Title order={3} mb={4}>
                Perubahan Indikator
              </Title>

              <Text size="sm" c="dimmed" mb="lg">
                Perbandingan terhadap bulan sebelumnya dan
                bulan yang sama tahun sebelumnya.
              </Text>

              <SimpleGrid
                cols={{
                  base: 1,
                  md: 2,
                }}
              >
                <ComparisonCard
                  title="Tingkat Penghunian Kamar"
                  metric={analytics.tpk.total}
                  currentSuffix="%"
                  changeSuffix=" poin"
                />

                <ComparisonCard
                  title="Rata-Rata Lama Menginap"
                  metric={analytics.rlmt.total}
                  currentSuffix=" hari"
                  changeSuffix=" hari"
                />
              </SimpleGrid>
            </div>
          )}

          {analytics && (
            <TpkClassificationSection
              classifications={
                analytics.tpk.classifications
              }
            />
          )}

          {analytics && (
            <TpkExtremes history={analytics.history} />
          )}

          {analytics && (
            <RlmtExtremes history={analytics.history} />
          )}
          {analytics && (
            <div>
              <Title order={3} mb={4}>
                Grafik Perkembangan Pariwisata
              </Title>

              <Text size="sm" c="dimmed" mb="lg">
                Perkembangan indikator selama 13 bulan
                sampai dengan periode yang dipilih.
              </Text>

              <TourismTrendCharts
                history={analytics.history}
              />
            </div>
          )}
        </>
      )}
    </Stack>
  );
}

interface RlmtExtremesProps {
  history: BrsHistoryPeriod[];
}

function RlmtExtremes({ history }: RlmtExtremesProps) {
  const metrics = [
    {
      key: 'rlmtTotal',
      label: 'Seluruh Tamu',
      color: 'blue',
    },
    {
      key: 'rlmtAsing',
      label: 'Tamu Asing',
      color: 'orange',
    },
    {
      key: 'rlmtNusantara',
      label: 'Tamu Nusantara',
      color: 'green',
    },
  ] as const;

  return (
    <div>
      <Title order={3} mb={4}>
        Rekor Rata-Rata Lama Menginap
      </Title>

      <Text size="sm" c="dimmed" mb="lg">
        Periode tertinggi dan terendah selama 13 bulan
        berdasarkan jenis tamu.
      </Text>

      <SimpleGrid
        cols={{
          base: 1,
          md: 3,
        }}
      >
        {metrics.map((metric) => {
          const extremes = calculateRlmtExtremes(
            history,
            metric.key
          );

          return (
            <Paper
              key={metric.key}
              withBorder
              p="lg"
              radius="md"
            >
              <Text fw={700} size="lg" mb="md">
                {metric.label}
              </Text>

              {!extremes ? (
                <Text size="sm" c="dimmed">
                  Data belum tersedia.
                </Text>
              ) : (
                <Stack gap="md">
                  <div>
                    <Badge
                      color={metric.color}
                      variant="light"
                      mb={4}
                    >
                      Tertinggi
                    </Badge>

                    <Text fw={600}>
                      {formatHistoryPeriod(
                        extremes.highest.period
                      )}
                    </Text>

                    <Text fw={700} fz={24}>
                      {decimalFormatter.format(
                        extremes.highest.value
                      )}{' '}
                      hari
                    </Text>
                  </div>

                  <div>
                    <Badge
                      color="gray"
                      variant="light"
                      mb={4}
                    >
                      Terendah
                    </Badge>

                    <Text fw={600}>
                      {formatHistoryPeriod(
                        extremes.lowest.period
                      )}
                    </Text>

                    <Text fw={700} fz={24}>
                      {decimalFormatter.format(
                        extremes.lowest.value
                      )}{' '}
                      hari
                    </Text>
                  </div>
                </Stack>
              )}
            </Paper>
          );
        })}
      </SimpleGrid>
    </div>
  );
}

interface TpkExtremesProps {
  history: BrsHistoryPeriod[];
}

function TpkExtremes({ history }: TpkExtremesProps) {
  const availablePeriods = history.filter(
    (
      period
    ): period is BrsHistoryPeriod & {
      tpkTotal: number;
    } => period.available && period.tpkTotal !== null
  );

  if (availablePeriods.length === 0) {
    return (
      <Alert
        color="yellow"
        title="Riwayat TPK belum tersedia"
      >
        Belum tersedia data untuk menentukan periode
        tertinggi dan terendah.
      </Alert>
    );
  }

  const highest = availablePeriods.reduce(
    (result, period) =>
      period.tpkTotal > result.tpkTotal ? period : result
  );

  const lowest = availablePeriods.reduce(
    (result, period) =>
      period.tpkTotal < result.tpkTotal ? period : result
  );

  return (
    <div>
      <Title order={3} mb={4}>
        Rekor TPK Selama 13 Bulan
      </Title>

      <Text size="sm" c="dimmed" mb="lg">
        Periode dengan TPK total tertinggi dan terendah
        dalam rentang data yang ditampilkan.
      </Text>

      <SimpleGrid
        cols={{
          base: 1,
          md: 2,
        }}
      >
        <Paper withBorder p="lg" radius="md" bg="blue.0">
          <Badge color="blue" variant="light" mb="sm">
            Tertinggi
          </Badge>

          <Text fw={700} size="lg">
            {formatHistoryPeriod(highest)}
          </Text>

          <Text fw={700} fz={30} c="blue.8">
            {decimalFormatter.format(highest.tpkTotal)}%
          </Text>
        </Paper>

        <Paper withBorder p="lg" radius="md" bg="orange.0">
          <Badge color="orange" variant="light" mb="sm">
            Terendah
          </Badge>

          <Text fw={700} size="lg">
            {formatHistoryPeriod(lowest)}
          </Text>

          <Text fw={700} fz={30} c="orange.8">
            {decimalFormatter.format(lowest.tpkTotal)}%
          </Text>
        </Paper>
      </SimpleGrid>
    </div>
  );
}

interface TpkClassificationSectionProps {
  classifications: ClassificationComparison[];
}

function TpkClassificationSection({
  classifications,
}: TpkClassificationSectionProps) {
  const available = classifications.filter(
    (item) =>
      item.key !== 'TOTAL_BINTANG' && item.current !== null
  );

  if (available.length === 0) {
    return (
      <Alert
        color="yellow"
        title="TPK per klasifikasi belum tersedia"
      >
        Belum tersedia data hotel berdasarkan klasifikasi
        bintang.
      </Alert>
    );
  }

  const highest = available.reduce((result, item) =>
    (item.current ?? 0) > (result.current ?? 0)
      ? item
      : result
  );

  const lowest = available.reduce((result, item) =>
    (item.current ?? 0) < (result.current ?? 0)
      ? item
      : result
  );

  return (
    <div>
      <Title order={3} mb={4}>
        TPK Menurut Klasifikasi Hotel
      </Title>

      <Text size="sm" c="dimmed" mb="lg">
        Perbandingan Tingkat Penghunian Kamar berdasarkan
        klasifikasi hotel bintang.
      </Text>

      <SimpleGrid
        cols={{
          base: 1,
          md: 2,
        }}
        mb="lg"
      >
        <Paper withBorder p="lg" radius="md" bg="green.0">
          <Text size="sm" c="dimmed">
            TPK tertinggi
          </Text>

          <Text fw={700} size="lg" mt={4}>
            {highest.label}
          </Text>

          <Text fw={700} fz={28} c="green.8">
            {decimalFormatter.format(highest.current ?? 0)}%
          </Text>
        </Paper>

        <Paper withBorder p="lg" radius="md" bg="red.0">
          <Text size="sm" c="dimmed">
            TPK terendah
          </Text>

          <Text fw={700} size="lg" mt={4}>
            {lowest.label}
          </Text>

          <Text fw={700} fz={28} c="red.8">
            {decimalFormatter.format(lowest.current ?? 0)}%
          </Text>
        </Paper>
      </SimpleGrid>

      <SimpleGrid
        cols={{
          base: 1,
          md: 2,
          xl: 4,
        }}
      >
        {available.map((classification) => (
          <ComparisonCard
            key={classification.key}
            title={classification.label}
            metric={classification}
            currentSuffix="%"
            changeSuffix=" poin"
          />
        ))}
      </SimpleGrid>
    </div>
  );
}

interface ComparisonCardProps {
  title: string;
  metric: MetricComparison;
  currentSuffix: string;
  changeSuffix: string;
}

function ComparisonCard({
  title,
  metric,
  currentSuffix,
  changeSuffix,
}: ComparisonCardProps) {
  return (
    <Paper withBorder p="lg" radius="md">
      <Text size="sm" c="dimmed">
        {title}
      </Text>

      <Text fw={700} fz={30} mt={4} mb="md">
        {formatMetricValue(metric.current, currentSuffix)}
      </Text>

      <Stack gap="sm">
        <Group justify="space-between">
          <Text size="sm">Dibanding bulan lalu</Text>

          <ChangeBadge
            value={metric.mtmChange}
            status={metric.mtmStatus}
            suffix={changeSuffix}
          />
        </Group>

        <Group justify="space-between">
          <Text size="sm">Dibanding tahun lalu</Text>

          <ChangeBadge
            value={metric.yoyChange}
            status={metric.yoyStatus}
            suffix={changeSuffix}
          />
        </Group>
      </Stack>
    </Paper>
  );
}

interface ChangeBadgeProps {
  value: number | null;
  status: ChangeStatus;
  suffix: string;
}

function ChangeBadge({
  value,
  status,
  suffix,
}: ChangeBadgeProps) {
  if (value === null || status === 'TIDAK_TERSEDIA') {
    return (
      <Badge color="gray" variant="light">
        Tidak tersedia
      </Badge>
    );
  }

  const colors: Record<ChangeStatus, string> = {
    NAIK: 'green',
    TURUN: 'red',
    TETAP: 'gray',
    TIDAK_TERSEDIA: 'gray',
  };

  const labels: Record<ChangeStatus, string> = {
    NAIK: 'Naik',
    TURUN: 'Turun',
    TETAP: 'Tetap',
    TIDAK_TERSEDIA: 'Tidak tersedia',
  };

  return (
    <Badge color={colors[status]} variant="light">
      {labels[status]}{' '}
      {decimalFormatter.format(Math.abs(value))}
      {suffix}
    </Badge>
  );
}

function IndicatorCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <Paper withBorder p="lg" radius="md" shadow="xs">
      <Text size="sm" c="dimmed">
        {label}
      </Text>

      <Text fw={700} fz={28} mt="xs">
        {value}
      </Text>

      <Text size="xs" c="dimmed" mt="xs">
        {description}
      </Text>
    </Paper>
  );
}

function DashboardSkeleton() {
  return (
    <SimpleGrid
      cols={{
        base: 1,
        sm: 2,
        lg: 4,
      }}
    >
      {Array.from({ length: 8 }).map((_, index) => (
        <Skeleton key={index} height={140} radius="md" />
      ))}
    </SimpleGrid>
  );
}

function formatNullableNumber(
  value: number | null
): string {
  return value === null
    ? '–'
    : decimalFormatter.format(value);
}

function formatMetricValue(
  value: number | null,
  suffix: string
) {
  if (value === null) {
    return '–';
  }

  return decimalFormatter.format(value) + suffix;
}

function formatHistoryPeriod(period: BrsHistoryPeriod) {
  const month = MONTH_OPTIONS.find(
    (item) => item.value === String(period.bulan)
  )?.label;

  return `${month ?? period.bulan} ${period.tahun}`;
}

type RlmtMetricKey =
  | 'rlmtTotal'
  | 'rlmtAsing'
  | 'rlmtNusantara';

function calculateRlmtExtremes(
  history: BrsHistoryPeriod[],
  key: RlmtMetricKey
) {
  const values = history.flatMap((period) => {
    const value = period[key];

    if (!period.available || value === null) {
      return [];
    }

    return [
      {
        period,
        value,
      },
    ];
  });

  if (values.length === 0) {
    return null;
  }

  const highest = values.reduce((result, item) =>
    item.value > result.value ? item : result
  );

  const lowest = values.reduce((result, item) =>
    item.value < result.value ? item : result
  );

  return {
    highest,
    lowest,
  };
}
