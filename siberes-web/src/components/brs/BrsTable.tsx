import { Badge, Table } from '@mantine/core';

import { Brs } from '@/types/brs';

const namaBulan = [
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
  return (
    <Table striped highlightOnHover withTableBorder>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Periode</Table.Th>
          <Table.Th>Nomor BRS</Table.Th>
          <Table.Th>Tanggal Publikasi</Table.Th>
          <Table.Th>Status</Table.Th>
        </Table.Tr>
      </Table.Thead>

      <Table.Tbody>
        {data.map((brs) => (
          <Table.Tr key={brs.id}>
            <Table.Td>
              {namaBulan[brs.bulan]} {brs.tahun}
            </Table.Td>

            <Table.Td>{brs.nomorBrs ?? '-'}</Table.Td>

            <Table.Td>
              {brs.tanggalPublikasi
                ? new Date(
                    brs.tanggalPublikasi
                  ).toLocaleDateString('id-ID')
                : '-'}
            </Table.Td>

            <Table.Td>
              <Badge>{brs.status}</Badge>
            </Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
}
