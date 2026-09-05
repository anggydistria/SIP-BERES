import { Container } from '@mantine/core';

import { RoleGate } from '@/components/auth/RoleGate';
import { ExcelUpload } from '@/components/data-upload/ExcelUpload';

export default function BrsUploadPage() {
  return (
    <RoleGate
      allowedRoles={['KETUA_BRS']}
      redirectTo="/brs"
    >
      <Container size="xl" py="xl">
        <ExcelUpload />
      </Container>
    </RoleGate>
  );
}
