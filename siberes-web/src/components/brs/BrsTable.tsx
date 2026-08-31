import { Badge, Table, Text } from '@mantine/core';

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
                  color={
                    brs.status === 'FINAL'
                      ? 'green'
                      : 'yellow'
                  }
                  variant="light"
                >
                  {brs.status}
                </Badge>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}
