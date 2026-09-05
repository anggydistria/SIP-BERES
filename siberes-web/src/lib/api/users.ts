import { apiFetch } from './api-fetch';

import type {
  CreateUserPayload,
  UpdateUserPayload,
  UpdateUserStatusResponse,
  User,
} from '@/types/user';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:3001/api';

async function parseResponse<T>(
  response: Response
): Promise<T> {
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

export async function getUsers(): Promise<User[]> {
  const response = await apiFetch(`${API_URL}/users`, {
    method: 'GET',
    cache: 'no-store',
  });

  return parseResponse<User[]>(response);
}

export async function getUser(id: number): Promise<User> {
  const response = await apiFetch(
    `${API_URL}/users/${id}`,
    {
      method: 'GET',
      cache: 'no-store',
    }
  );

  return parseResponse<User>(response);
}

export async function createUser(
  payload: CreateUserPayload
): Promise<User> {
  const response = await apiFetch(`${API_URL}/users`, {
    method: 'POST',

    headers: {
      'Content-Type': 'application/json',
    },

    body: JSON.stringify(payload),
  });

  return parseResponse<User>(response);
}

export async function updateUser(
  id: number,
  payload: UpdateUserPayload
): Promise<User> {
  const response = await apiFetch(
    `${API_URL}/users/${id}`,
    {
      method: 'PATCH',

      headers: {
        'Content-Type': 'application/json',
      },

      body: JSON.stringify(payload),
    }
  );

  return parseResponse<User>(response);
}

export async function updateUserStatus(
  id: number,
  isActive: boolean
): Promise<UpdateUserStatusResponse> {
  const response = await apiFetch(
    `${API_URL}/users/${id}/status`,
    {
      method: 'PATCH',

      headers: {
        'Content-Type': 'application/json',
      },

      body: JSON.stringify({
        isActive,
      }),
    }
  );

  return parseResponse<UpdateUserStatusResponse>(response);
}
