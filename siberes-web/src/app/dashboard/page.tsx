import { Container } from '@mantine/core';

import { DashboardView } from '@/components/dashboard/DashboardView';

export default function DashboardPage() {
  return (
    <Container size="xl" py="xl">
      <DashboardView />
    </Container>
  );
}
