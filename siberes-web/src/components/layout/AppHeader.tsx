'use client';

import {
  Badge,
  Button,
  Container,
  Group,
  Paper,
  Text,
} from '@mantine/core';

import Link from 'next/link';

import { usePathname, useRouter } from 'next/navigation';

import { useState } from 'react';

import { useAuth } from '@/context/AuthContext';

import type { UserRole } from '@/types/auth';

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Administrator',
  KETUA_BRS: 'Ketua BRS',
  PENGELOLA: 'Pengelola',
};

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();

  const { user, logout } = useAuth();

  const [loggingOut, setLoggingOut] = useState(false);

  if (!user) {
    return null;
  }

  async function handleLogout() {
    setLoggingOut(true);

    try {
      await logout();

      router.replace('/login');
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <Paper component="header" radius={0} withBorder py="sm">
      <Container size="xl">
        <Group justify="space-between" wrap="wrap">
          <Group>
            <Text fw={800} size="lg" c="blue">
              SIBERES
            </Text>

            <Button
              component={Link}
              href="/dashboard"
              variant={
                pathname.startsWith('/dashboard')
                  ? 'light'
                  : 'subtle'
              }
              size="sm"
            >
              Dashboard
            </Button>

            <Button
              component={Link}
              href="/brs"
              variant={
                pathname.startsWith('/brs')
                  ? 'light'
                  : 'subtle'
              }
              size="sm"
            >
              Daftar BRS
            </Button>
          </Group>

          <Group gap="sm">
            <div>
              <Text size="sm" fw={600} ta="right">
                {user.name}
              </Text>

              <Group gap={4} justify="flex-end">
                {user.roles.map((role) => (
                  <Badge
                    key={role}
                    size="xs"
                    variant="light"
                  >
                    {ROLE_LABELS[role]}
                  </Badge>
                ))}
              </Group>
            </div>

            <Button
              color="red"
              variant="light"
              size="sm"
              loading={loggingOut}
              onClick={() => {
                void handleLogout();
              }}
            >
              Keluar
            </Button>
          </Group>
        </Group>
      </Container>
    </Paper>
  );
}
