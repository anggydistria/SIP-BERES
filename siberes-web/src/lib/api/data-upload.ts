import type {
  ExcelPreviewResponse,
  SaveExcelResponse,
  UploadExcelPeriod,
} from '@/types/data-upload';
import { apiFetch } from './api-fetch';
const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:3001/api';

async function sendExcelFile<T>(
  endpoint: string,
  file: File,
  period: UploadExcelPeriod
): Promise<T> {
  const formData = new FormData();

  formData.append('file', file);
  formData.append('bulan', String(period.bulan));
  formData.append('tahun', String(period.tahun));

  const response = await apiFetch(
    `${API_URL}${endpoint}`,
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

    throw new Error(
      message ?? 'Terjadi kesalahan pada server'
    );
  }

  return data as T;
}

export function previewExcel(
  file: File,
  period: UploadExcelPeriod
): Promise<ExcelPreviewResponse> {
  return sendExcelFile<ExcelPreviewResponse>(
    '/data-uploads/preview',
    file,
    period
  );
}

export function saveExcel(
  file: File,
  period: UploadExcelPeriod
): Promise<SaveExcelResponse> {
  return sendExcelFile<SaveExcelResponse>(
    '/data-uploads',
    file,
    period
  );
}

export async function downloadActiveExcel(id: number) {
  const response = await apiFetch(
    `${API_URL}/data-uploads/${id}/file`
  );

  if (!response.ok) {
    const data = (await response
      .json()
      .catch(() => null)) as {
      message?: string | string[];
    } | null;

    const message = Array.isArray(data?.message)
      ? data.message.join(', ')
      : data?.message;

    throw new Error(message ?? 'File Excel gagal diunduh');
  }

  const blob = await response.blob();

  const disposition = response.headers.get(
    'Content-Disposition'
  );

  const match = disposition?.match(
    /filename\*=UTF-8''([^;]+)/
  );

  const filename = match?.[1]
    ? decodeURIComponent(match[1])
    : 'data-brs.xlsx';

  const objectUrl = URL.createObjectURL(blob);

  const anchor = document.createElement('a');

  anchor.href = objectUrl;
  anchor.download = filename;

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  URL.revokeObjectURL(objectUrl);
}
