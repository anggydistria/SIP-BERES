import type {
  ExcelPreviewResponse,
  SaveExcelResponse,
} from '@/types/data-upload';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:3001/api';

async function sendExcelFile<T>(
  endpoint: string,
  file: File
): Promise<T> {
  const formData = new FormData();

  formData.append('file', file);

  const response = await fetch(`${API_URL}${endpoint}`, {
    method: 'POST',
    body: formData,
  });

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

    throw new Error(
      message ?? 'Terjadi kesalahan pada server'
    );
  }

  return data as T;
}

export function previewExcel(
  file: File
): Promise<ExcelPreviewResponse> {
  return sendExcelFile<ExcelPreviewResponse>(
    '/data-uploads/preview',
    file
  );
}

export function saveExcel(
  file: File
): Promise<SaveExcelResponse> {
  return sendExcelFile<SaveExcelResponse>(
    '/data-uploads',
    file
  );
}
