'use client';

import {
  Button,
  Container,
  Group,
  Modal,
  Paper,
  Stack,
  Title,
} from '@mantine/core';

import { useDisclosure } from '@mantine/hooks';
import { useEffect, useState } from 'react';

import { BrsForm } from '@/components/brs/BrsForm';
import { BrsTable } from '@/components/brs/BrsTable';

import { getBrsList } from '@/lib/api/brs';
import { Brs } from '@/types/brs';

export default function BrsPage() {
  const [opened, { open, close }] = useDisclosure(false);

  const [data, setData] = useState<Brs[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    try {
      setLoading(true);

      const result = await getBrsList();

      setData(result);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleSuccess() {
    close();
    await loadData();
  }

  return (
    <Container size="lg" py="xl">
      <Stack gap="lg">
        <Group justify="space-between">
          <Title order={2}>BRS Pariwisata</Title>

          <Button onClick={open}>Tambah BRS</Button>
        </Group>

        <Paper withBorder p="md" radius="md">
          {loading ? (
            <div>Memuat data...</div>
          ) : (
            <BrsTable data={data} />
          )}
        </Paper>
      </Stack>

      <Modal
        opened={opened}
        onClose={close}
        title="Tambah BRS Pariwisata"
      >
        <BrsForm onSuccess={handleSuccess} />
      </Modal>
    </Container>
  );
}
