'use client';

import { useState } from 'react';

import {
  Button,
  Group,
  NumberInput,
  Select,
  Stack,
  TextInput,
} from '@mantine/core';

import { createBrs } from '@/lib/api/brs';

const bulanOptions = [
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

interface BrsFormProps {
  onSuccess: () => void;
}

export function BrsForm({ onSuccess }: BrsFormProps) {
  const [bulan, setBulan] = useState<string | null>(null);

  const [tahun, setTahun] = useState<number | string>(
    new Date().getFullYear()
  );

  const [nomorBrs, setNomorBrs] = useState('');
  const [tanggalPublikasi, setTanggalPublikasi] =
    useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!bulan || !tahun) {
      setError('Bulan dan tahun wajib diisi');
      return;
    }

    try {
      setLoading(true);
      setError('');

      await createBrs({
        jenisBrs: 'PARIWISATA',
        bulan: Number(bulan),
        tahun: Number(tahun),

        nomorBrs: nomorBrs || undefined,

        tanggalPublikasi: tanggalPublikasi || undefined,
      });

      setBulan(null);
      setNomorBrs('');
      setTanggalPublikasi('');

      onSuccess();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Terjadi kesalahan'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Stack>
        <TextInput
          label="Jenis BRS"
          value="Pariwisata"
          disabled
        />

        <Select
          label="Bulan"
          placeholder="Pilih bulan"
          data={bulanOptions}
          value={bulan}
          onChange={setBulan}
          required
        />

        <NumberInput
          label="Tahun"
          value={tahun}
          onChange={setTahun}
          min={2000}
          max={2100}
          required
        />

        <TextInput
          label="Nomor BRS"
          placeholder="Contoh: 35/08/6472/Th. XXVIII"
          value={nomorBrs}
          onChange={(event) =>
            setNomorBrs(event.currentTarget.value)
          }
        />

        <TextInput
          type="date"
          label="Tanggal Publikasi"
          value={tanggalPublikasi}
          onChange={(event) =>
            setTanggalPublikasi(event.currentTarget.value)
          }
        />

        {error && (
          <div style={{ color: 'red' }}>{error}</div>
        )}

        <Group justify="flex-end">
          <Button type="submit" loading={loading}>
            Simpan BRS
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
