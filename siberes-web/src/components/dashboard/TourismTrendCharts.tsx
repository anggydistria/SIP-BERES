'use client';

import { LineChart } from '@mantine/charts';

import {
  Alert,
  Paper,
  Stack,
  Text,
  Title,
} from '@mantine/core';

import type { BrsHistoryPeriod } from '@/types/brs-preview';

interface TourismTrendChartsProps {
  history: BrsHistoryPeriod[];
}

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

const SHORT_MONTH_NAMES = [
  '',
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

const decimalFormatter = new Intl.NumberFormat('id-ID', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function TourismTrendCharts({
  history,
}: TourismTrendChartsProps) {
  const availablePeriods = history.filter(
    (period) => period.available
  );

  if (availablePeriods.length === 0) {
    return (
      <Alert color="yellow" title="Grafik belum tersedia">
        Belum ada data periode yang dapat ditampilkan.
      </Alert>
    );
  }

  const firstPeriod = history[0];
  const lastPeriod = history[history.length - 1];

  const periodRange =
    firstPeriod && lastPeriod
      ? `${periodLabel(firstPeriod)}–${periodLabel(lastPeriod)}`
      : '';

  const tpkData = history.map((period) => ({
    periode: shortPeriodLabel(period),

    total: period.tpkTotal,

    bintang12: getClassificationValue(
      period,
      'BINTANG_1_2'
    ),

    bintang3: getClassificationValue(period, 'BINTANG_3'),

    bintang4: getClassificationValue(period, 'BINTANG_4'),

    bintang5: getClassificationValue(period, 'BINTANG_5'),
  }));

  const rlmtData = history.map((period) => ({
    periode: shortPeriodLabel(period),

    seluruhTamu: period.rlmtTotal,

    tamuAsing: period.rlmtAsing,

    tamuNusantara: period.rlmtNusantara,
  }));

  return (
    <Stack gap="lg">
      <Paper withBorder p="lg" radius="md">
        <Title order={4} ta="center">
          Perkembangan TPK Hotel Klasifikasi Bintang di Kota
          Samarinda (persen), {periodRange}
        </Title>

        <Text
          size="sm"
          c="dimmed"
          ta="center"
          mt={4}
          mb="lg"
        >
          Tingkat Penghunian Kamar hotel klasifikasi bintang
        </Text>

        <LineChart
          h={380}
          data={tpkData}
          dataKey="periode"
          series={[
            {
              name: 'total',
              label: 'Total Bintang',
              color: 'blue.7',
            },
            {
              name: 'bintang12',
              label: 'Bintang 1 dan 2',
              color: 'cyan.6',
            },
            {
              name: 'bintang3',
              label: 'Bintang 3',
              color: 'green.6',
            },
            {
              name: 'bintang4',
              label: 'Bintang 4',
              color: 'orange.6',
            },
            {
              name: 'bintang5',
              label: 'Bintang 5',
              color: 'red.6',
            },
          ]}
          curveType="linear"
          connectNulls={false}
          withLegend
          withDots
          gridAxis="xy"
          yAxisProps={{
            domain: [0, 100],
          }}
          valueFormatter={(value) =>
            `${decimalFormatter.format(value)}%`
          }
        />
      </Paper>

      <Paper withBorder p="lg" radius="md">
        <Title order={4} ta="center">
          Rata-Rata Lama Menginap Tamu Hotel Klasifikasi
          Bintang di Kota Samarinda (hari), {periodRange}
        </Title>

        <Text
          size="sm"
          c="dimmed"
          ta="center"
          mt={4}
          mb="lg"
        >
          Perkembangan rata-rata lama menginap berdasarkan
          jenis tamu
        </Text>

        <LineChart
          h={380}
          data={rlmtData}
          dataKey="periode"
          series={[
            {
              name: 'seluruhTamu',
              label: 'Seluruh Tamu',
              color: 'blue.7',
            },
            {
              name: 'tamuAsing',
              label: 'Tamu Asing',
              color: 'orange.6',
            },
            {
              name: 'tamuNusantara',
              label: 'Tamu Nusantara',
              color: 'green.6',
            },
          ]}
          curveType="linear"
          connectNulls={false}
          withLegend
          withDots
          gridAxis="xy"
          yAxisProps={{
            domain: [0, 'auto'],
          }}
          valueFormatter={(value) =>
            `${decimalFormatter.format(value)} hari`
          }
        />
      </Paper>
    </Stack>
  );
}

function getClassificationValue(
  period: BrsHistoryPeriod,
  key: string
) {
  return (
    period.tpkClassifications.find(
      (classification) => classification.key === key
    )?.value ?? null
  );
}

function periodLabel(period: BrsHistoryPeriod) {
  return `${MONTH_NAMES[period.bulan]} ${period.tahun}`;
}

function shortPeriodLabel(period: BrsHistoryPeriod) {
  return `${
    SHORT_MONTH_NAMES[period.bulan]
  } ${String(period.tahun).slice(-2)}`;
}
