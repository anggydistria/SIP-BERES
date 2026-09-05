import type {
  BrsAnalytics,
  BrsNarrative,
  BrsPreviewData,
} from '@/types/brs-preview';
import { apiFetch } from './api-fetch';
const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:3001/api';

export async function getBrsPreview(
  bulan: number,
  tahun: number
): Promise<BrsPreviewData> {
  const searchParams = new URLSearchParams({
    bulan: String(bulan),
    tahun: String(tahun),
  });

  const query = searchParams.toString();

  const [analytics, narrative] = await Promise.all([
    requestJson<BrsAnalytics>(
      `${API_URL}/brs-analytics?${query}`
    ),

    requestJson<BrsNarrative>(
      `${API_URL}/brs-analytics/narrative?${query}`
    ),
  ]);

  return {
    analytics,
    narrative,
  };
}

async function requestJson<T>(url: string): Promise<T> {
 const response = await apiFetch(url, {
   cache: 'no-store',
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
      message ?? 'Gagal mengambil preview BRS'
    );
  }

  return data as T;
}
