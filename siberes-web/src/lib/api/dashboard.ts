import type { DashboardSummary } from '@/types/dashboard';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:3001/api';

export async function getDashboardSummary(
  bulan: number,
  tahun: number
): Promise<DashboardSummary> {
  const searchParams = new URLSearchParams({
    bulan: String(bulan),
    tahun: String(tahun),
  });

  const response = await fetch(
    `${API_URL}/dashboard?${searchParams.toString()}`,
    {
      cache: 'no-store',
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
      message ?? 'Gagal mengambil data dashboard'
    );
  }

  return data as DashboardSummary;
}
