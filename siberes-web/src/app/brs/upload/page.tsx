import { Container } from '@mantine/core';

import { ExcelUpload } from '@/components/data-upload/ExcelUpload';

export default function BrsUploadPage() {
  return (
    <Container size="xl" py="xl">
      <ExcelUpload />
    </Container>
  );
}
