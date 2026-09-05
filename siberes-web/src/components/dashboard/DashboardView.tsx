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
  ThemeIcon,
  Title,
  Tabs,
} from '@mantine/core';
import {
  IconAdjustments,
  IconBed,
  IconBuilding,
  IconChartBar,
  IconChartLine,
  IconClock,
  IconLayoutDashboard,
  IconMapPin,
  IconPercentage,
  IconPlane,
  IconTrendingUp,
  IconUsers,
  IconWorld,
  IconArrowDownRight,
  IconArrowUpRight,
  IconHelpCircle,
  IconMinus,
  IconTrophy,
} from '@tabler/icons-react';

import type { ComponentType } from 'react';
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
      limit: 50,
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
      <Paper withBorder p="lg">
        <Stack gap="lg">
          <Group justify="space-between">
            <Group wrap="nowrap">
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
                <IconLayoutDashboard
                  size={30}
                  stroke={1.8}
                />
              </ThemeIcon>

              <div>
                <Title order={2}>
                  Dashboard Pariwisata
                </Title>

                <Text c="dimmed" mt={2}>
                  Ringkasan perkembangan pariwisata Kota
                  Samarinda
                </Text>
              </div>
            </Group>

            <Badge
              color="bpsOrange"
              variant="light"
              size="lg"
            >
              Statistik Pariwisata
            </Badge>
          </Group>

          <Paper withBorder p="md" bg="white" shadow="xs">
            <Group align="end">
              <ThemeIcon
                color="bpsBlue"
                variant="light"
                size={38}
              >
                <IconAdjustments size={21} />
              </ThemeIcon>

              <Select
                label="Tahun"
                placeholder="Pilih tahun"
                data={availableYears}
                value={year}
                onChange={handleYearChange}
                allowDeselect={false}
                w={140}
              />

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

              <Button
                leftSection={<IconChartBar size={18} />}
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
                  xs: 2,
                  lg: 4,
                }}
                spacing="md"
              >
                <IndicatorCard
                  icon={IconBuilding}
                  color="bpsBlue"
                  label="Malam kamar tersedia"
                  value={integerFormatter.format(
                    summary.indicators.malamKamarTersedia
                  )}
                  description="Total MKTS"
                />

                <IndicatorCard
                  icon={IconBed}
                  color="bpsOrange"
                  label="Malam kamar terjual"
                  value={integerFormatter.format(
                    summary.indicators.malamKamarTerjual
                  )}
                  description="Total MKTJ"
                />

                <IndicatorCard
                  icon={IconPlane}
                  color="bpsGreen"
                  label="Tamu asing"
                  value={integerFormatter.format(
                    summary.indicators.tamuAsing
                  )}
                  description="Jumlah tamu asing"
                />

                <IndicatorCard
                  icon={IconUsers}
                  color="bpsBlue"
                  label="Tamu nusantara"
                  value={integerFormatter.format(
                    summary.indicators.tamuNusantara
                  )}
                  description="Jumlah tamu nusantara"
                />

                <IndicatorCard
                  icon={IconPercentage}
                  color="bpsOrange"
                  label="Tingkat penghunian kamar"
                  value={`${decimalFormatter.format(
                    summary.indicators
                      .tingkatPenghunianKamar
                  )}%`}
                  description="MKTJ ÷ MKTS × 100"
                />

                <IndicatorCard
                  icon={IconClock}
                  color="bpsGreen"
                  label="Rata-rata lama menginap"
                  value={decimalFormatter.format(
                    summary.indicators.rataLamaMenginap
                  )}
                  description="Gabungan seluruh tamu"
                />

                <IndicatorCard
                  icon={IconWorld}
                  color="bpsOrange"
                  label="RLM tamu asing"
                  value={formatNullableNumber(
                    summary.indicators.rataLamaMenginapAsing
                  )}
                  description="Malam tamu asing ÷ tamu asing"
                />

                <IndicatorCard
                  icon={IconMapPin}
                  color="bpsGreen"
                  label="RLM tamu nusantara"
                  value={formatNullableNumber(
                    summary.indicators
                      .rataLamaMenginapNusantara
                  )}
                  description="Malam tamu nusantara ÷ tamu nusantara"
                />
              </SimpleGrid>
              {analytics && (
                <Tabs
                  defaultValue="ringkasan"
                  variant="pills"
                  color="bpsBlue"
                  radius="md"
                >
                  <Tabs.List
                    grow
                    p={6}
                    bg="bpsBlue.0"
                    style={{
                      borderRadius:
                        'var(--mantine-radius-md)',
                    }}
                  >
                    <Tabs.Tab
                      value="ringkasan"
                      leftSection={
                        <IconTrendingUp size={18} />
                      }
                    >
                      Ringkasan
                    </Tabs.Tab>

                    <Tabs.Tab
                      value="tpk"
                      leftSection={
                        <IconPercentage size={18} />
                      }
                    >
                      Tingkat Penghunian Kamar
                    </Tabs.Tab>

                    <Tabs.Tab
                      value="rlmt"
                      leftSection={<IconClock size={18} />}
                    >
                      Rata-Rata Lama Menginap
                    </Tabs.Tab>
                  </Tabs.List>

                  <Tabs.Panel value="ringkasan" pt="lg">
                    <Stack gap="lg">
                      <SectionHeading
                        icon={IconTrendingUp}
                        color="bpsGreen"
                        title="Perubahan Indikator"
                        description="Perbandingan terhadap bulan sebelumnya dan bulan yang sama tahun sebelumnya."
                      />

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
                    </Stack>
                  </Tabs.Panel>

                  <Tabs.Panel value="tpk" pt="lg">
                    <Stack gap="xl">
                      <TpkClassificationSection
                        classifications={
                          analytics.tpk.classifications
                        }
                      />

                      <TpkExtremes
                        history={analytics.history}
                      />

                      <SectionHeading
                        icon={IconChartLine}
                        color="bpsBlue"
                        title="Perkembangan TPK"
                        description="Perkembangan Tingkat Penghunian Kamar selama 13 bulan sampai periode yang dipilih."
                      />

                      <TourismTrendCharts
                        history={analytics.history}
                        metric="tpk"
                      />
                    </Stack>
                  </Tabs.Panel>

                  <Tabs.Panel value="rlmt" pt="lg">
                    <Stack gap="xl">
                      <RlmtExtremes
                        history={analytics.history}
                      />

                      <div>
                        <SectionHeading
                          icon={IconChartLine}
                          color="bpsOrange"
                          title="Perkembangan RLMT"
                          description="Perkembangan rata-rata lama menginap selama 13 bulan sampai periode yang dipilih."
                        />

                        <TourismTrendCharts
                          history={analytics.history}
                          metric="rlmt"
                        />
                      </div>
                    </Stack>
                  </Tabs.Panel>
                </Tabs>
              )}
            </>
          )}
        </Stack>
      </Paper>
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
    },
    {
      key: 'rlmtAsing',
      label: 'Tamu Asing',
    },
    {
      key: 'rlmtNusantara',
      label: 'Tamu Nusantara',
    },
  ] as const;

return (
  <div>
    <SectionHeading
      icon={IconClock}
      color="bpsBlue"
      title="Rekor Rata-Rata Lama Menginap"
      description="Periode tertinggi dan terendah selama 13 bulan berdasarkan jenis tamu."
    />

    <SimpleGrid
      cols={{
        base: 1,
        lg: 3,
      }}
      mt="lg"
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
            p="md"
            shadow="xs"
          >
            <Group mb="md">
              <ThemeIcon
                color="bpsBlue"
                variant="light"
                size={38}
              >
                <IconClock size={21} />
              </ThemeIcon>

              <Text fw={700} size="lg">
                {metric.label}
              </Text>
            </Group>

            {!extremes ? (
              <Alert
                color="yellow"
                title="Data belum tersedia"
              >
                Belum tersedia data untuk jenis tamu ini.
              </Alert>
            ) : (
              <Stack gap="md">
                <ExtremeCard
                  type="highest"
                  label={formatHistoryPeriod(
                    extremes.highest.period
                  )}
                  value={decimalFormatter.format(
                    extremes.highest.value
                  )}
                  suffix=" hari"
                />

                <ExtremeCard
                  type="lowest"
                  label={formatHistoryPeriod(
                    extremes.lowest.period
                  )}
                  value={decimalFormatter.format(
                    extremes.lowest.value
                  )}
                  suffix=" hari"
                />
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
      <SectionHeading
        icon={IconTrophy}
        color="bpsOrange"
        title="Rekor TPK Selama 13 Bulan"
        description="Periode dengan TPK total tertinggi dan terendah dalam rentang data yang ditampilkan."
      />

      <SimpleGrid
        cols={{
          base: 1,
          md: 2,
        }}
        mt="lg"
      >
        <ExtremeCard
          type="highest"
          label={formatHistoryPeriod(highest)}
          value={decimalFormatter.format(highest.tpkTotal)}
          suffix="%"
        />

        <ExtremeCard
          type="lowest"
          label={formatHistoryPeriod(lowest)}
          value={decimalFormatter.format(lowest.tpkTotal)}
          suffix="%"
        />
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
      <SectionHeading
        icon={IconBuilding}
        color="bpsBlue"
        title="TPK Menurut Klasifikasi Hotel"
        description="Perbandingan Tingkat Penghunian Kamar berdasarkan klasifikasi hotel bintang."
      />

      <SimpleGrid
        cols={{
          base: 1,
          md: 2,
        }}
        mt="lg"
        mb="lg"
      >
        <ExtremeCard
          type="highest"
          label={highest.label}
          value={decimalFormatter.format(
            highest.current ?? 0
          )}
          suffix="%"
        />

        <ExtremeCard
          type="lowest"
          label={lowest.label}
          value={decimalFormatter.format(
            lowest.current ?? 0
          )}
          suffix="%"
        />
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
    <Paper
      withBorder
      p="lg"
      radius="md"
      shadow="xs"
      style={{
        borderLeft:
          '4px solid var(--mantine-color-bpsBlue-6)',
      }}
    >
      <Group justify="space-between" align="flex-start">
        <div>
          <Text size="sm" c="dimmed">
            {title}
          </Text>

          <Text fw={750} fz={30} mt={4}>
            {formatMetricValue(
              metric.current,
              currentSuffix
            )}
          </Text>
        </div>

        <ThemeIcon
          color="bpsBlue"
          variant="light"
          size={40}
          radius="md"
        >
          <IconTrendingUp size={22} />
        </ThemeIcon>
      </Group>

      <Stack gap="sm" mt="md">
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
      <Badge
        color="gray"
        variant="light"
        leftSection={<IconHelpCircle size={13} />}
      >
        Tidak tersedia
      </Badge>
    );
  }

  const configurations = {
    NAIK: {
      color: 'bpsGreen',
      label: 'Naik',
      icon: IconArrowUpRight,
    },

    TURUN: {
      color: 'red',
      label: 'Turun',
      icon: IconArrowDownRight,
    },

    TETAP: {
      color: 'gray',
      label: 'Tetap',
      icon: IconMinus,
    },

    TIDAK_TERSEDIA: {
      color: 'gray',
      label: 'Tidak tersedia',
      icon: IconHelpCircle,
    },
  } as const;

  const configuration = configurations[status];
  const StatusIcon = configuration.icon;

  return (
    <Badge
      color={configuration.color}
      variant="light"
      leftSection={<StatusIcon size={13} stroke={2} />}
    >
      {configuration.label}{' '}
      {decimalFormatter.format(Math.abs(value))}
      {suffix}
    </Badge>
  );
}

type IndicatorColor = 'bpsBlue' | 'bpsOrange' | 'bpsGreen';

interface IndicatorCardProps {
  icon: ComponentType<{
    size?: number | string;
    stroke?: number;
  }>;
  color: IndicatorColor;
  label: string;
  value: string;
  description: string;
}

interface SectionHeadingProps {
  icon: ComponentType<{
    size?: number | string;
    stroke?: number;
  }>;
  color: IndicatorColor;
  title: string;
  description: string;
}

function SectionHeading({
  icon: Icon,
  color,
  title,
  description,
}: SectionHeadingProps) {
  return (
    <Group align="flex-start" wrap="nowrap">
      <ThemeIcon
        color={color}
        variant="light"
        size={42}
        radius="md"
      >
        <Icon size={23} stroke={1.8} />
      </ThemeIcon>

      <div>
        <Title order={3}>{title}</Title>

        <Text size="sm" c="dimmed" mt={2}>
          {description}
        </Text>
      </div>
    </Group>
  );
}

interface ExtremeCardProps {
  type: 'highest' | 'lowest';
  label: string;
  value: string;
  suffix?: string;
}

function ExtremeCard({
  type,
  label,
  value,
  suffix = '',
}: ExtremeCardProps) {
  const isHighest = type === 'highest';

  const color = isHighest ? 'bpsGreen' : 'bpsOrange';

  const Icon = isHighest ? IconTrophy : IconArrowDownRight;

  return (
    <Paper
      withBorder
      p="lg"
      h="100%"
      bg={`${color}.0`}
      style={{
        borderColor: `var(--mantine-color-${color}-2)`,
      }}
    >
      <Group
        justify="space-between"
        align="flex-start"
        wrap="nowrap"
      >
        <div>
          <Badge
            color={color}
            variant="light"
            leftSection={<Icon size={13} stroke={2} />}
          >
            {isHighest ? 'Tertinggi' : 'Terendah'}
          </Badge>

          <Text fw={700} size="lg" mt="sm">
            {label}
          </Text>

          <Text fw={750} fz={30} c={`${color}.8`} lh={1.2}>
            {value}
            {suffix}
          </Text>
        </div>

        <ThemeIcon
          color={color}
          variant="filled"
          size={46}
          radius="xl"
          flex="0 0 auto"
        >
          <Icon size={25} stroke={1.8} />
        </ThemeIcon>
      </Group>
    </Paper>
  );
}
function IndicatorCard({
  icon: Icon,
  color,
  label,
  value,
  description,
}: IndicatorCardProps) {
  return (
    <Paper
      withBorder
      p="lg"
      shadow="xs"
      h="100%"
      style={{
        borderTop: `4px solid var(--mantine-color-${color}-6)`,
      }}
    >
      <Group align="flex-start" wrap="nowrap">
        <ThemeIcon
          color={color}
          variant="light"
          size={46}
          radius="md"
          flex="0 0 auto"
        >
          <Icon size={25} stroke={1.8} />
        </ThemeIcon>

        <div>
          <Text size="sm" c="dimmed" lh={1.3}>
            {label}
          </Text>

          <Text fw={750} fz={26} mt={4} lh={1.2}>
            {value}
          </Text>

          <Text size="xs" c="dimmed" mt={6}>
            {description}
          </Text>
        </div>
      </Group>
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
