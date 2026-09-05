import { apiFetch } from './api-fetch';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:3001/api';

/*
 * Ketua menyatakan draft sudah siap.
 */
export async function markDraftReady(brsId: number) {
  return requestJson(
    `${API_URL}/brs/${brsId}/draft-ready`,
    {
      method: 'PATCH',
    }
  );
}

/*
 * Pengelola mengunggah calon PDF final.
 */
export async function submitFinalBrs(
  brsId: number,
  file: File,
  nomorBrs: string,
  tanggalPublikasi?: string
) {
  const formData = new FormData();

  formData.append('file', file);
  formData.append('nomorBrs', nomorBrs);

  if (tanggalPublikasi) {
    formData.append('tanggalPublikasi', tanggalPublikasi);
  }

  return requestJson(
    `${API_URL}/brs/${brsId}/final-submission`,
    {
      method: 'POST',
      body: formData,
    }
  );
}

/*
 * Ketua menyetujui calon BRS final.
 */
export async function approveFinalBrs(brsId: number) {
  return requestJson(
    `${API_URL}/brs/${brsId}/final-submission/approve`,
    {
      method: 'POST',
    }
  );
}

/*
 * Ketua menolak calon BRS final.
 */
export async function rejectFinalBrs(
  brsId: number,
  note: string
) {
  return requestJson(
    `${API_URL}/brs/${brsId}/final-submission/reject`,
    {
      method: 'POST',

      headers: {
        'Content-Type': 'application/json',
      },

      body: JSON.stringify({
        note,
      }),
    }
  );
}

/*
 * Mengunduh calon PDF untuk direview.
 */
export function downloadPendingFinal(brsId: number) {
  return downloadFile(
    `${API_URL}/brs/${brsId}/final-submission/file`,
    'calon-brs-final.pdf'
  );
}
export function previewPendingFinal(brsId: number) {
  openPdf(
    `${API_URL}/brs/${brsId}/final-submission/preview`
  );
}

/*
 * Mengunduh PDF BRS yang sudah disetujui.
 */
export function downloadApprovedFinal(brsId: number) {
  return downloadFile(
    `${API_URL}/brs/${brsId}/final-file`,
    'brs-final.pdf'
  );
}
export function previewApprovedFinal(brsId: number) {
  openPdf(`${API_URL}/brs/${brsId}/final-file/preview`);
}
/*
 * Helper untuk request yang menghasilkan JSON.
 */
async function requestJson(url: string, init: RequestInit) {
  const response = await apiFetch(url, init);

  const data = (await response.json()) as {
    message?: string | string[];
  };

  if (!response.ok) {
    const message = Array.isArray(data.message)
      ? data.message.join(', ')
      : data.message;

    throw new Error(message ?? 'Permintaan gagal diproses');
  }

  return data;
}
/*
 * Helper untuk mengunduh file dari backend.
 */
async function downloadFile(
  url: string,
  fallbackFilename: string
) {
  const response = await apiFetch(url);

  if (!response.ok) {
    const data = (await response
      .json()
      .catch(() => null)) as {
      message?: string | string[];
    } | null;

    const message = Array.isArray(data?.message)
      ? data.message.join(', ')
      : data?.message;

    throw new Error(message ?? 'File gagal diunduh');
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
    : fallbackFilename;

  const objectUrl = URL.createObjectURL(blob);

  const anchor = document.createElement('a');

  anchor.href = objectUrl;
  anchor.download = filename;

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  URL.revokeObjectURL(objectUrl);
}
function openPdf(url: string) {
  const previewWindow = window.open(url, '_blank');

  if (!previewWindow) {
    throw new Error(
      'Preview diblokir oleh browser. Izinkan pop-up untuk membuka PDF.'
    );
  }

  previewWindow.opener = null;
}
