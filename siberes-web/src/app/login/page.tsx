'use client';

import {
  Alert,
  Button,
  Container,
  Paper,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';

import { useRouter } from 'next/navigation';

import { FormEvent, useEffect, useState } from 'react';

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
    <Container size={420} py={80}>
      <Stack gap="lg">
        <div>
          <Title order={1} ta="center">
            SIBERES
          </Title>

          <Text c="dimmed" ta="center" mt={4}>
            Sistem Informasi BRS Pariwisata
          </Text>
        </div>

        <Paper withBorder shadow="sm" p="xl" radius="md">
          <form onSubmit={handleSubmit}>
            <Stack>
              <Title order={3}>Masuk</Title>

              <Text size="sm" c="dimmed">
                Masukkan akun untuk melanjutkan.
              </Text>

              {error && (
                <Alert color="red" title="Login gagal">
                  {error}
                </Alert>
              )}

              <TextInput
                label="Username"
                placeholder="Masukkan username"
                value={username}
                onChange={(event) => {
                  setUsername(event.currentTarget.value);
                }}
                autoComplete="username"
                required
              />

              <PasswordInput
                label="Password"
                placeholder="Masukkan password"
                value={password}
                onChange={(event) => {
                  setPassword(event.currentTarget.value);
                }}
                autoComplete="current-password"
                required
              />

              <Button
                type="submit"
                loading={submitting}
                disabled={loading}
                fullWidth
              >
                Masuk
              </Button>
            </Stack>
          </form>
        </Paper>
      </Stack>
    </Container>
  );
}
