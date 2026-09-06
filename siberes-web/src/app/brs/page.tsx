'use client';
import {
  Alert,
  Badge,
  Button,
  Container,
  Group,
  NumberInput,
  Pagination,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';

import {
  IconAdjustments,
  IconFileText,
  IconRefresh,
  IconSearch,
  IconUpload,
} from '@tabler/icons-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { BrsTable } from '@/components/brs/BrsTable';
import { getBrsList } from '@/lib/api/brs';
import type { Brs, BrsPaginationMeta } from '@/types/brs';
import { useAuth } from '@/context/AuthContext';
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
  const [pageSize, setPageSize] = useState('10');

  const [month, setMonth] = useState<string | null>(null);

  const [year, setYear] = useState<number | string>('');

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const { hasRole } = useAuth();

  const canUploadExcel = hasRole('KETUA_BRS');
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

  async function loadData(
    targetPage: number,
    targetLimit = Number(pageSize)
  ) {
    setLoading(true);
    setError(null);

    try {
      const numericYear = Number(year);

      const result = await getBrsList({
        page: targetPage,
        limit: targetLimit,

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
      limit: Number(pageSize),
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

  function handlePageSizeChange(nextPageSize: string) {
    setPageSize(nextPageSize);

    void loadData(1, Number(nextPageSize));
  }

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        <Paper
          withBorder
          p={{
            base: 'md',
            sm: 'lg',
          }}
          shadow="xs"
          style={{
            background:
              'linear-gradient(135deg, var(--mantine-color-bpsBlue-0), var(--mantine-color-bpsGreen-0))',
            borderColor: 'var(--mantine-color-bpsBlue-2)',
          }}
        >
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
                  <Title order={2}>
                    Daftar BRS Pariwisata
                  </Title>

                  <Text c="dimmed" mt={2}>
                    Kelola dan pantau seluruh BRS
                    perkembangan pariwisata Kota Samarinda.
                  </Text>
                </div>
              </Group>

              <Group>
                <Badge
                  color="bpsBlue"
                  variant="light"
                  size="lg"
                >
                  {meta.total} BRS
                </Badge>

                {canUploadExcel && (
                  <Button
                    component={Link}
                    href="/brs/upload"
                    leftSection={<IconUpload size={18} />}
                  >
                    Unggah Data BRS
                  </Button>
                )}
              </Group>
            </Group>

            <Paper withBorder p="md" bg="white" shadow="xs">
              <Group mb="sm">
                <ThemeIcon
                  color="bpsBlue"
                  variant="light"
                  size={36}
                >
                  <IconAdjustments size={20} />
                </ThemeIcon>

                <div>
                  <Text fw={650}>Filter Daftar BRS</Text>

                  <Text size="xs" c="dimmed">
                    Pilih periode untuk mempersempit data.
                  </Text>
                </div>
              </Group>

              <SimpleGrid
                cols={{
                  base: 1,
                  sm: 2,
                  lg: 4,
                }}
                spacing="md"
                style={{
                  alignItems: 'end',
                }}
              >
                <NumberInput
                  label="Tahun"
                  placeholder="Semua tahun"
                  value={year}
                  onChange={setYear}
                  min={2000}
                  max={2100}
                  allowDecimal={false}
                  allowNegative={false}
                />

                <Select
                  label="Bulan"
                  placeholder="Semua bulan"
                  data={MONTH_OPTIONS}
                  value={month}
                  onChange={setMonth}
                  clearable
                />

                <Button
                  leftSection={<IconSearch size={18} />}
                  onClick={() => {
                    void loadData(1);
                  }}
                  loading={loading}
                >
                  Terapkan Filter
                </Button>

                <Button
                  variant="light"
                  color="gray"
                  leftSection={<IconRefresh size={18} />}
                  onClick={handleReset}
                  disabled={loading}
                >
                  Reset Filter
                </Button>
              </SimpleGrid>
            </Paper>
          </Stack>
        </Paper>

        {error && (
          <Alert
            color="red"
            title="Daftar BRS gagal dimuat"
            withCloseButton
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}

        <BrsPagination
          meta={meta}
          displayedRows={data.length}
          pageSize={pageSize}
          loading={loading}
          onPageChange={(selectedPage) => {
            void loadData(selectedPage);
          }}
          onPageSizeChange={handlePageSizeChange}
        />

        <Paper withBorder p="md" radius="md">
          {loading ? (
            <Text c="dimmed">Memuat data...</Text>
          ) : (
            <BrsTable data={data} />
          )}
        </Paper>

        <BrsPagination
          meta={meta}
          displayedRows={data.length}
          pageSize={pageSize}
          loading={loading}
          onPageChange={(selectedPage) => {
            void loadData(selectedPage);
          }}
          onPageSizeChange={handlePageSizeChange}
        />
      </Stack>
    </Container>
  );
}
interface BrsPaginationProps {
  meta: BrsPaginationMeta;
  displayedRows: number;
  pageSize: string;
  loading: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: string) => void;
}

function BrsPagination({
  meta,
  displayedRows,
  pageSize,
  loading,
  onPageChange,
  onPageSizeChange,
}: BrsPaginationProps) {
  if (meta.total === 0) {
    return null;
  }

  const firstRow = (meta.page - 1) * meta.limit + 1;

  const lastRow = firstRow + displayedRows - 1;

  return (
    <Paper withBorder p="sm" shadow="xs">
      <Group justify="space-between">
        <Group gap="sm">
          <Text size="sm" c="dimmed">
            Tampilkan
          </Text>

          <Select
            value={pageSize}
            data={[
              { value: '10', label: '10' },
              { value: '25', label: '25' },
              { value: '50', label: '50' },
         
            ]}
            onChange={(value) => {
              onPageSizeChange(value ?? '10');
            }}
            allowDeselect={false}
            disabled={loading}
            w={80}
          />

          <Text size="sm" c="dimmed">
            data per halaman
          </Text>
        </Group>

        <Text size="sm" c="dimmed">
          Menampilkan {firstRow}–{lastRow} dari {meta.total}{' '}
          BRS
        </Text>

        <Pagination
          value={meta.page}
          total={Math.max(meta.totalPages, 1)}
          onChange={onPageChange}
          disabled={loading}
          color="bpsBlue"
          withEdges
        />
      </Group>
    </Paper>
  );
}