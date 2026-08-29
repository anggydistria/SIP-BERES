import type { ExcelPreviewResponse } from '@/types/data-upload';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:3001/api';

export async function previewExcel(
  file: File
): Promise<ExcelPreviewResponse> {
  const formData = new FormData();

  formData.append('file', file);

  const response = await fetch(
    `${API_URL}/data-uploads/preview`,
    {
      method: 'POST',
      body: formData,
    }
  );

  const responseText = await response.text();

  let data: unknown;

  try {
    data = JSON.parse(responseText);
  } catch {
    throw new Error(
      `Server tidak mengirim JSON (${response.status})`
    );
  }

  if (!response.ok) {
    const errorData = data as {
      message?: string | string[];
    };

    const message = Array.isArray(errorData.message)
      ? errorData.message.join(', ')
      : errorData.message;

    throw new Error(message ?? 'Gagal membaca file Excel');
  }

  return data as ExcelPreviewResponse;
}
