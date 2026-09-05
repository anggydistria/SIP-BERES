'use client';

import {
  Alert,
  Button,
  Container,
  Stack,
} from '@mantine/core';

import Link from 'next/link';

import { useAuth } from '@/context/AuthContext';

import { ExcelUpload } from '@/components/data-upload/ExcelUpload';

export default function BrsUploadPage() {
  const { hasRole } = useAuth();

  if (!hasRole('KETUA_BRS')) {
    return (
      <Container size="md" py="xl">
        <Stack>
          <Alert color="red" title="Akses ditolak">
            Hanya Ketua BRS yang dapat mengunggah data
            Excel.
          </Alert>

          <Button
            component={Link}
            href="/brs"
            variant="light"
          >
            Kembali ke Daftar BRS
          </Button>
        </Stack>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      <ExcelUpload />
    </Container>
  );
}
