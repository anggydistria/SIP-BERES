'use client';

import { Center, Loader, Stack, Text } from '@mantine/core';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useAuth } from '@/context/AuthContext';
import type { UserRole } from '@/types/auth';

interface RoleGateProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  redirectTo?: string;
}

export function RoleGate({
  children,
  allowedRoles,
  redirectTo = '/dashboard',
}: RoleGateProps) {
  const router = useRouter();
  const { user, loading } = useAuth();

  const hasPermission =
    user?.roles.some((role) =>
      allowedRoles.includes(role)
    ) ?? false;

  useEffect(() => {
    if (!loading && user && !hasPermission) {
      router.replace(redirectTo);
    }
  }, [loading, user, hasPermission, redirectTo, router]);

  if (loading || !user || !hasPermission) {
    return (
      <Center mih={300}>
        <Stack align="center" gap="sm">
          <Loader />

          <Text size="sm" c="dimmed">
            Memeriksa hak akses...
          </Text>
        </Stack>
      </Center>
    );
  }

  return children;
}
