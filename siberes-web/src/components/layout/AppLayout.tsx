'use client';

import {
  AppShell,
  Badge,
  Burger,
  Button,
  Divider,
  Group,
  NavLink,
  Paper,
  ScrollArea,
  Stack,
  Text,
  ThemeIcon,
} from '@mantine/core';

import { useDisclosure } from '@mantine/hooks';

import {
  IconChartLine,
  IconFileText,
  IconLogout,
  IconShieldCheck,
  IconUpload,
  IconUsers,
  IconThumbUp,
} from '@tabler/icons-react';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

import { useAuth } from '@/context/AuthContext';
import type { UserRole } from '@/types/auth';

interface AppLayoutProps {
  children: React.ReactNode;
}

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Administrator',
  KETUA_BRS: 'Ketua BRS',
  PENGELOLA: 'Pengelola',
};

export function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();

  const { user, logout } = useAuth();

  const [
    navbarOpened,
    { toggle: toggleNavbar, close: closeNavbar },
  ] = useDisclosure(false);

  const [loggingOut, setLoggingOut] = useState(false);

  if (!user) {
    return null;
  }

  const isAdmin = user.roles.includes('ADMIN');

  const isKetua = user.roles.includes('KETUA_BRS');

  const brsMenuActive =
    pathname.startsWith('/brs') &&
    pathname !== '/brs/upload';

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
    <AppShell
      header={{
        height: 64,
      }}
      navbar={{
        width: 270,
        breakpoint: 'sm',

        collapsed: {
          mobile: !navbarOpened,
        },
      }}
      padding={0}
    >
      <AppShell.Header
        px={{
          base: 'md',
          sm: 'lg',
        }}
        style={{
          borderColor: 'var(--mantine-color-bpsBlue-2)',
        }}
      >
        <Group
          h="100%"
          justify="space-between"
          wrap="nowrap"
        >
          <Group wrap="nowrap">
            <Burger
              opened={navbarOpened}
              onClick={toggleNavbar}
              hiddenFrom="sm"
              size="sm"
              aria-label="Buka navigasi"
            />

            <ThemeIcon
              size={40}
              radius="md"
              variant="gradient"
              gradient={{
                from: 'bpsBlue.6',
                to: 'bpsGreen.6',
                deg: 135,
              }}
            >
              <IconThumbUp size={23} stroke={1.9} />
            </ThemeIcon>

            <div>
              <Text
                fw={800}
                size="lg"
                c="bpsBlue.8"
                lh={1.1}
              >
                SIBERES
              </Text>

              <Text size="xs" c="dimmed" visibleFrom="xs">
                BPS Kota Samarinda
              </Text>
            </div>
          </Group>

          <Group gap="sm" wrap="nowrap">
            <div>
              <Text size="sm" fw={600} ta="right">
                {user.name}
              </Text>

              <Text
                size="xs"
                c="dimmed"
                ta="right"
                visibleFrom="xs"
              >
                {user.username}
              </Text>
            </div>

            <ThemeIcon
              color="bpsBlue"
              variant="light"
              size={38}
              radius="xl"
            >
              <IconUsers size={20} />
            </ThemeIcon>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar
        p="md"
        style={{
          background:
            'linear-gradient(180deg, white, var(--mantine-color-bpsBlue-0))',
          borderColor: 'var(--mantine-color-bpsBlue-2)',
        }}
      >
        <AppShell.Section mb="md">
          <Text
            size="xs"
            fw={700}
            c="dimmed"
            tt="uppercase"
            px="sm"
          >
            Menu Utama
          </Text>
        </AppShell.Section>

        <AppShell.Section component={ScrollArea} grow>
          <Stack gap={5}>
            <NavLink
              component={Link}
              href="/dashboard"
              label="Dashboard"
              description="Perkembangan pariwisata"
              leftSection={<IconChartLine size={21} />}
              active={pathname.startsWith('/dashboard')}
              color="bpsBlue"
              variant="light"
              onClick={closeNavbar}
            />

            <NavLink
              component={Link}
              href="/brs"
              label="Daftar BRS"
              description="Dokumen BRS bulanan"
              leftSection={<IconFileText size={21} />}
              active={brsMenuActive}
              color="bpsBlue"
              variant="light"
              onClick={closeNavbar}
            />

            {isKetua && (
              <NavLink
                component={Link}
                href="/brs/upload"
                label="Unggah Data BRS"
                description="Upload dan validasi Excel"
                leftSection={<IconUpload size={21} />}
                active={pathname === '/brs/upload'}
                color="bpsOrange"
                variant="light"
                onClick={closeNavbar}
              />
            )}

            {isAdmin && (
              <>
                <Divider
                  my="sm"
                  label="Administrasi"
                  labelPosition="left"
                />

                <NavLink
                  component={Link}
                  href="/admin/users"
                  label="Kelola Pengguna"
                  description="Akun dan hak akses"
                  leftSection={
                    <IconShieldCheck size={21} />
                  }
                  active={pathname.startsWith(
                    '/admin/users'
                  )}
                  color="bpsGreen"
                  variant="light"
                  onClick={closeNavbar}
                />
              </>
            )}
          </Stack>
        </AppShell.Section>

        <AppShell.Section mt="md">
          <Paper withBorder p="sm" bg="white">
            <Group
              justify="space-between"
              align="flex-start"
              mb="sm"
            >
              <div>
                <Text size="sm" fw={650}>
                  {user.name}
                </Text>

                <Text size="xs" c="dimmed">
                  {user.username}
                </Text>
              </div>

              <ThemeIcon
                color="bpsGreen"
                variant="light"
                size={32}
                radius="xl"
              >
                <IconShieldCheck size={17} />
              </ThemeIcon>
            </Group>

            <Group gap={5} mb="sm">
              {user.roles.map((role) => (
                <Badge
                  key={role}
                  size="xs"
                  color="bpsBlue"
                  variant="light"
                >
                  {ROLE_LABELS[role]}
                </Badge>
              ))}
            </Group>

            <Button
              color="red"
              variant="light"
              size="xs"
              leftSection={<IconLogout size={16} />}
              loading={loggingOut}
              onClick={() => {
                void handleLogout();
              }}
              fullWidth
            >
              Keluar
            </Button>
          </Paper>
        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main
        style={{
          backgroundColor: '#f5f8fc',
          minHeight: '100vh',
        }}
      >
        {children}
      </AppShell.Main>
    </AppShell>
  );
}
