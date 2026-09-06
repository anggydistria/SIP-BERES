'use client';

import { Center, Loader, Stack, Text } from '@mantine/core';

import { usePathname, useRouter } from 'next/navigation';

import { useEffect } from 'react';

import { useAuth } from '@/context/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';

interface AuthGateProps {
  children: React.ReactNode;
}

export function AuthGate({ children }: AuthGateProps) {
  const pathname = usePathname();
  const router = useRouter();

  const { user, loading } = useAuth();

  const isPublicPage = pathname === '/login';

  useEffect(() => {
    if (!loading && !user && !isPublicPage) {
      router.replace('/login');
    }
  }, [loading, user, isPublicPage, router]);

  if (isPublicPage) {
    return children;
  }

  if (loading) {
    return (
      <Center mih="100vh">
        <Stack align="center" gap="sm">
          <Loader />

          <Text c="dimmed">Memeriksa sesi pengguna...</Text>
        </Stack>
      </Center>
    );
  }

  if (!user) {
    return null;
  }

 return <AppLayout>{children}</AppLayout>;
}
