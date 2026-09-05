import { Container } from '@mantine/core';

import { RoleGate } from '@/components/auth/RoleGate';
import { UsersView } from '@/components/users/UsersView';

export default function UsersPage() {
  return (
    <RoleGate allowedRoles={['ADMIN']}>
      <Container size="xl" py="xl">
        <UsersView />
      </Container>
    </RoleGate>
  );
}
