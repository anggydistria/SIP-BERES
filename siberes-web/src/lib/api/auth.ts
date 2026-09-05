import type {
  AuthResponse,
  LoginPayload,
} from '@/types/auth';
import { apiFetch } from './api-fetch';
const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:3001/api';

export function login(
  payload: LoginPayload
): Promise<AuthResponse> {
  return requestJson<AuthResponse>(
    `${API_URL}/auth/login`,
    {
      method: 'POST',

      headers: {
        'Content-Type': 'application/json',
      },

      body: JSON.stringify(payload),
    }
  );
}

export function getCurrentUser(): Promise<AuthResponse> {
  return requestJson<AuthResponse>(`${API_URL}/auth/me`, {
    method: 'GET',
  });
}

export async function logout() {
  await requestJson<{
    message: string;
  }>(`${API_URL}/auth/logout`, {
    method: 'POST',
  });
}

async function requestJson<T>(
  url: string,
  init: RequestInit
): Promise<T> {
  const response = await apiFetch(url, init);

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

    throw new Error(message ?? 'Permintaan gagal diproses');
  }

  return data as T;
}
