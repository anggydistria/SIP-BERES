import type {
  Brs,
  BrsDetail,
  BrsListParams,
  BrsListResponse,
  CreateBrsPayload,
} from '@/types/brs';

import { apiFetch } from './api-fetch';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:3001/api';

async function parseResponse<T>(
  response: Response
): Promise<T> {
  const contentType = response.headers.get('content-type');

  if (!contentType?.includes('application/json')) {
    const responseText = await response.text();

    throw new Error(
      `Server tidak mengirim JSON (${response.status}): ${responseText}`
    );
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      Array.isArray(data.message)
        ? data.message.join(', ')
        : (data.message ?? 'Terjadi kesalahan pada server')
    );
  }

  return data as T;
}

export async function getBrsList(
  params: BrsListParams = {}
): Promise<BrsListResponse> {
  const searchParams = new URLSearchParams();

  searchParams.set('page', String(params.page ?? 1));

  searchParams.set('limit', String(params.limit ?? 10));

  if (params.bulan !== undefined) {
    searchParams.set('bulan', String(params.bulan));
  }

  if (params.tahun !== undefined) {
    searchParams.set('tahun', String(params.tahun));
  }

  const response = await apiFetch(
    `${API_URL}/brs?${searchParams.toString()}`,
    {
      cache: 'no-store',
    }
  );

  return parseResponse<BrsListResponse>(response);
}

export async function createBrs(
  payload: CreateBrsPayload
): Promise<Brs> {
  const response = await apiFetch(`${API_URL}/brs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
 
  });

  return parseResponse<Brs>(response);
}

export async function getBrsDetail(
  id: number
): Promise<BrsDetail> {
  const response = await apiFetch(`${API_URL}/brs/${id}`, {
    cache: 'no-store',
    
  });

  const data = (await response.json()) as
    | BrsDetail
    | {
        message?: string | string[];
      };

  if (!response.ok) {
    const error = data as {
      message?: string | string[];
    };

    const message = Array.isArray(error.message)
      ? error.message.join(', ')
      : error.message;

    throw new Error(
      message ?? 'Gagal mengambil detail BRS'
    );
  }

  return data as BrsDetail;
}
