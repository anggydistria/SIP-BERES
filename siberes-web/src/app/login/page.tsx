'use client';

import {
  Alert,
  Box,
  Button,
  Center,
  Group,
  Paper,
  PasswordInput,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
  Title,
} from '@mantine/core';

import {
  IconChartLine,
  IconFileCheck,
  IconFileText,
  IconLogin2,
  IconShieldCheck,
  IconUser,
 
} from '@tabler/icons-react';
import Image from 'next/image';

import { useRouter } from 'next/navigation';

import { useEffect, useState, type FormEvent } from 'react';

import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const router = useRouter();

  const { user, loading, login } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [loading, user, router]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!username.trim() || !password) {
      setError('Username dan password wajib diisi.');

      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await login({
        username: username.trim(),
        password,
      });

      router.replace('/dashboard');
      router.refresh();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Login gagal'
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Center
      mih="100vh"
      px="md"
      py={{
        base: 'xl',
        md: 50,
      }}
      style={{
        background:
          'radial-gradient(circle at top left, var(--mantine-color-bpsBlue-1), transparent 38%), radial-gradient(circle at bottom right, var(--mantine-color-bpsGreen-1), transparent 35%), #f5f8fc',
      }}
    >
      <Paper
        withBorder
        shadow="xl"
        radius="lg"
        maw={1000}
        w="100%"
        style={{
          overflow: 'hidden',
          borderColor: 'var(--mantine-color-bpsBlue-2)',
        }}
      >
        <SimpleGrid
          cols={{
            base: 1,
            md: 2,
          }}
          spacing={0}
        >
          <Box
            p={{
              base: 'xl',
              md: 48,
            }}
            style={{
              background:
                'linear-gradient(145deg, var(--mantine-color-bpsBlue-8), var(--mantine-color-bpsBlue-6) 55%, var(--mantine-color-bpsGreen-6))',
              color: 'white',
            }}
          >
            <Stack
              justify="space-between"
              mih={{
                base: 350,
                md: 560,
              }}
            >
              <div>
                <Group mb={36}>
                
                    <Image
                      src="/siberes-logo.svg"
                      alt="Logo SIBERES"
                      width={58}
                      height={58}
                      priority
                    />
                

                  <div>
                    <Title
                      order={1}
                      c="white"
                      fw={800}
                      lh={1}
                    >
                      SIBERES
                    </Title>

                    <Text
                      size="sm"
                      c="rgba(255, 255, 255, 0.78)"
                      mt={5}
                    >
                      BPS Kota Samarinda
                    </Text>
                  </div>
                </Group>

                <Title
                  order={2}
                  c="white"
                  maw={420}
                  lh={1.25}
                >
                  Penyusunan BRS Pariwisata yang lebih cepat
                  dan terintegrasi
                </Title>

                <Text
                  mt="md"
                  c="rgba(255, 255, 255, 0.82)"
                  lh={1.7}
                  maw={430}
                >
                  Kelola data, susun draft, lakukan review,
                  dan publikasikan BRS dalam satu sistem.
                </Text>

                <Stack gap="md" mt={34}>
                  <LoginFeature
                    icon={<IconChartLine size={20} />}
                    text="Dashboard perkembangan pariwisata"
                  />

                  <LoginFeature
                    icon={<IconFileCheck size={20} />}
                    text="Alur review BRS yang terpantau"
                  />

                  <LoginFeature
                    icon={<IconShieldCheck size={20} />}
                    text="Hak akses pengguna yang aman"
                  />
                </Stack>
              </div>

              <Text size="xs" c="rgba(255, 255, 255, 0.68)">
                Sistem Informasi BRS Pariwisata
              </Text>
            </Stack>
          </Box>

          <Box
            p={{
              base: 'xl',
              md: 48,
            }}
            bg="white"
          >
            <Stack
              justify="center"
              mih={{
                base: 460,
                md: 560,
              }}
            >
              <div>
                <Text
                  size="sm"
                  fw={700}
                  c="bpsBlue.7"
                  tt="uppercase"
                  mb={6}
                >
                  Selamat datang
                </Text>

                <Title order={2}>Masuk ke SIBERES</Title>

                <Text size="sm" c="dimmed" mt={7}>
                  Gunakan akun yang telah terdaftar untuk
                  melanjutkan.
                </Text>
              </div>

              {error && (
                <Alert
                  color="red"
                  title="Login gagal"
                  withCloseButton
                  onClose={() => setError(null)}
                >
                  {error}
                </Alert>
              )}

              <form onSubmit={handleSubmit}>
                <Stack gap="md">
                  <TextInput
                    label="Username"
                    placeholder="Masukkan username"
                    value={username}
                    leftSection={<IconUser size={18} />}
                    onChange={(event) => {
                      setUsername(
                        event.currentTarget.value
                      );
                    }}
                    autoComplete="username"
                    autoFocus
                    disabled={submitting}
                    size="md"
                    required
                  />

                  <PasswordInput
                    label="Password"
                    placeholder="Masukkan password"
                    value={password}
                    leftSection={
                      <IconShieldCheck size={18} />
                    }
                    onChange={(event) => {
                      setPassword(
                        event.currentTarget.value
                      );
                    }}
                    autoComplete="current-password"
                    disabled={submitting}
                    size="md"
                    required
                  />

                  <Button
                    type="submit"
                    size="md"
                    mt="sm"
                    loading={submitting}
                    disabled={loading}
                    leftSection={<IconLogin2 size={19} />}
                    fullWidth
                  >
                    Masuk
                  </Button>
                </Stack>
              </form>

              <Paper
                p="md"
                bg="bpsBlue.0"
                withBorder
                style={{
                  borderColor:
                    'var(--mantine-color-bpsBlue-2)',
                }}
              >
                <Group wrap="nowrap" align="flex-start">
                  <ThemeIcon
                    color="bpsBlue"
                    variant="light"
                    size={34}
                    radius="xl"
                    flex="0 0 auto"
                  >
                    <IconShieldCheck size={18} />
                  </ThemeIcon>

                  <Text size="xs" c="dimmed" lh={1.6}>
                    Akses sistem hanya diberikan kepada
                    pengguna yang terdaftar dan memiliki
                    role aktif.
                  </Text>
                </Group>
              </Paper>
            </Stack>
          </Box>
        </SimpleGrid>
      </Paper>
    </Center>
  );
}

interface LoginFeatureProps {
  icon: React.ReactNode;
  text: string;
}

function LoginFeature({ icon, text }: LoginFeatureProps) {
  return (
    <Group wrap="nowrap">
      <ThemeIcon
        variant="white"
        color="bpsBlue"
        radius="xl"
        size={38}
        flex="0 0 auto"
      >
        {icon}
      </ThemeIcon>

      <Text
        size="sm"
        fw={500}
        c="rgba(255, 255, 255, 0.92)"
      >
        {text}
      </Text>
    </Group>
  );
}
