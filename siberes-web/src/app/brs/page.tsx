'use client';

import {
  Alert,
  Button,
  Container,
  Group,
  NumberInput,
  Pagination,
  Paper,
  Select,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { BrsTable } from '@/components/brs/BrsTable';
import { getBrsList } from '@/lib/api/brs';
import type { Brs, BrsPaginationMeta } from '@/types/brs';

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

const INITIAL_META: BrsPaginationMeta = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
};

export default function BrsPage() {
  const [data, setData] = useState<Brs[]>([]);
  const [meta, setMeta] = useState(INITIAL_META);

  const [month, setMonth] = useState<string | null>(null);

  const [year, setYear] = useState<number | string>('');

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    getBrsList({
      page: 1,
      limit: 10,
    })
      .then((result) => {
        if (cancelled) {
          return;
        }

        setData(result.data);
        setMeta(result.meta);
        setError(null);
      })
      .catch((caughtError: unknown) => {
        if (cancelled) {
          return;
        }

        setError(
          caughtError instanceof Error
            ? caughtError.message
            : 'Gagal mengambil daftar BRS'
        );
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function loadData(targetPage: number) {
    setLoading(true);
    setError(null);

    try {
      const numericYear = Number(year);

      const result = await getBrsList({
        page: targetPage,
        limit: 10,

        bulan: month ? Number(month) : undefined,

        tahun:
          year !== '' && Number.isInteger(numericYear)
            ? numericYear
            : undefined,
      });

      setData(result.data);
      setMeta(result.meta);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Gagal mengambil daftar BRS'
      );
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setMonth(null);
    setYear('');

    setLoading(true);
    setError(null);

    getBrsList({
      page: 1,
      limit: 10,
    })
      .then((result) => {
        setData(result.data);
        setMeta(result.meta);
      })
      .catch((caughtError: unknown) => {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : 'Gagal mengambil daftar BRS'
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        <Group justify="space-between">
          <div>
            <Title order={2}>Daftar BRS Pariwisata</Title>

            <Text c="dimmed" mt={4}>
              Daftar BRS perkembangan pariwisata Kota
              Samarinda.
            </Text>
          </div>

          <Button component={Link} href="/brs/upload">
            Unggah Data BRS
          </Button>
        </Group>

        <Paper withBorder p="md" radius="md">
          <Group align="end">
            <NumberInput
              label="Tahun"
              placeholder="Semua tahun"
              value={year}
              onChange={setYear}
              min={2000}
              max={2100}
              allowDecimal={false}
              allowNegative={false}
              w={160}
            />

            <Select
              label="Bulan"
              placeholder="Semua bulan"
              data={MONTH_OPTIONS}
              value={month}
              onChange={setMonth}
              clearable
              w={180}
            />

            <Button
              onClick={() => {
                void loadData(1);
              }}
              loading={loading}
            >
              Terapkan Filter
            </Button>

            <Button
              variant="default"
              onClick={handleReset}
              disabled={loading}
            >
              Reset
            </Button>
          </Group>
        </Paper>

        {error && (
          <Alert
            color="red"
            title="Daftar BRS gagal dimuat"
          >
            {error}
          </Alert>
        )}

        <Paper withBorder p="md" radius="md">
          {loading ? (
            <Text c="dimmed">Memuat data...</Text>
          ) : (
            <BrsTable data={data} />
          )}
        </Paper>

        {meta.total > 0 && (
          <Group justify="space-between">
            <Text size="sm" c="dimmed">
              Menampilkan {data.length} dari {meta.total}{' '}
              BRS
            </Text>

            {meta.totalPages > 1 && (
              <Pagination
                value={meta.page}
                total={meta.totalPages}
                onChange={(selectedPage) => {
                  void loadData(selectedPage);
                }}
              />
            )}
          </Group>
        )}
      </Stack>
    </Container>
  );
}
