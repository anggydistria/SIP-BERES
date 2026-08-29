'use client';

import {
  Alert,
  Badge,
  Button,
  Group,
  NumberInput,
  Paper,
  Select,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { useCallback, useEffect, useState } from 'react';

import { getDashboardSummary } from '@/lib/api/dashboard';
import type { DashboardSummary } from '@/types/dashboard';

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
  const [month, setMonth] = useState('2');

  const [year, setYear] = useState<number | string>(2026);

  const [summary, setSummary] =
    useState<DashboardSummary | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

 useEffect(() => {
   let isCancelled = false;

   getDashboardSummary(2, 2026)
     .then((result) => {
       if (isCancelled) {
         return;
       }

       setSummary(result);
       setError(null);
     })
     .catch((caughtError: unknown) => {
       if (isCancelled) {
         return;
       }

       setSummary(null);

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
     const result = await getDashboardSummary(
       selectedMonth,
       selectedYear
     );

     setSummary(result);
   } catch (caughtError) {
     setSummary(null);

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
            data={MONTH_OPTIONS}
            value={month}
            onChange={(value) => {
              setMonth(value ?? '2');
            }}
            allowDeselect={false}
            w={180}
          />

          <NumberInput
            label="Tahun"
            value={year}
            onChange={setYear}
            min={2000}
            max={2100}
            allowDecimal={false}
            allowNegative={false}
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
          <Group justify="space-between">
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
              Versi {summary.dataUpload.version} ·{' '}
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
        </>
      )}
    </Stack>
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
