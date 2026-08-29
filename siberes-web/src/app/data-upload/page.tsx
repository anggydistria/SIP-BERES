import { Container } from '@mantine/core';

import { ExcelUpload } from '@/components/data-upload/ExcelUpload';

export default function DataUploadPage() {
  return (
    <Container size="xl" py="xl">
      <ExcelUpload />
    </Container>
  );
}
