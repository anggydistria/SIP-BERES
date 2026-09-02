import { Badge, Button, Table, Text } from '@mantine/core';
import Link from 'next/link';

import type { Brs } from '@/types/brs';

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

const STATUS_LABELS: Record<Brs['status'], string> = {
  DRAFT: 'Draft',
  DRAFT_READY: 'Draft Siap',
  FINAL_SUBMITTED: 'Menunggu Review',
  FINAL_REJECTED: 'Ditolak',
  FINAL: 'Final',
};

const STATUS_COLORS: Record<Brs['status'], string> = {
  DRAFT: 'gray',
  DRAFT_READY: 'blue',
  FINAL_SUBMITTED: 'orange',
  FINAL_REJECTED: 'red',
  FINAL: 'green',
};

interface BrsTableProps {
  data: Brs[];
}

export function BrsTable({ data }: BrsTableProps) {
  if (data.length === 0) {
    return (
      <Text c="dimmed" ta="center" py="xl">
        Data BRS tidak ditemukan.
      </Text>
    );
  }

  return (
    <Table.ScrollContainer minWidth={800}>
      <Table
        striped
        highlightOnHover
        withTableBorder
        withColumnBorders
      >
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Tahun</Table.Th>
            <Table.Th>Bulan</Table.Th>
            <Table.Th>Nomor BRS</Table.Th>
            <Table.Th>Tanggal Publikasi</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th>Aksi</Table.Th>
          </Table.Tr>
        </Table.Thead>

        <Table.Tbody>
          {data.map((brs) => (
            <Table.Tr key={brs.id}>
              <Table.Td>
                <Text fw={600}>{brs.tahun}</Text>
              </Table.Td>

              <Table.Td>{MONTH_NAMES[brs.bulan]}</Table.Td>

              <Table.Td>
                {brs.nomorBrs ?? 'Belum diisi'}
              </Table.Td>

              <Table.Td>
                {brs.tanggalPublikasi
                  ? new Date(
                      brs.tanggalPublikasi
                    ).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })
                  : 'Belum diisi'}
              </Table.Td>

              <Table.Td>
                <Badge
                  color={STATUS_COLORS[brs.status]}
                  variant="light"
                >
                  {STATUS_LABELS[brs.status]}
                </Badge>
              </Table.Td>
              <Table.Td>
                <Button
                  component={Link}
                  href={`/brs/${brs.id}`}
                  size="xs"
                  variant="light"
                >
                  Detail
                </Button>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}
