const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:3001/api';

interface DownloadBrsDocumentResult {
  blob: Blob;
  filename: string;
}

export async function downloadBrsDocument(
  bulan: number,
  tahun: number
): Promise<DownloadBrsDocumentResult> {
  const searchParams = new URLSearchParams({
    bulan: String(bulan),
    tahun: String(tahun),
  });

  const response = await fetch(
    `${API_URL}/brs-documents/generate?${searchParams.toString()}`,
    {
      method: 'GET',
    }
  );

  if (!response.ok) {
    const responseText = await response.text();

    try {
      const errorData = JSON.parse(responseText) as {
        message?: string | string[];
      };

      const message = Array.isArray(errorData.message)
        ? errorData.message.join(', ')
        : errorData.message;

      throw new Error(
        message ?? 'Gagal membuat dokumen BRS'
      );
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }

      throw new Error('Gagal membuat dokumen BRS');
    }
  }

  const blob = await response.blob();

  const contentDisposition = response.headers.get(
    'Content-Disposition'
  );

  const filename =
    getFilename(contentDisposition) ??
    `BRS-Pariwisata-${tahun}-${String(bulan).padStart(
      2,
      '0'
    )}.docx`;

  return {
    blob,
    filename,
  };
}

function getFilename(
  contentDisposition: string | null
): string | null {
  if (!contentDisposition) {
    return null;
  }

  const utfFilename = contentDisposition.match(
    /filename\*=UTF-8''([^;]+)/
  );

  if (utfFilename?.[1]) {
    return decodeURIComponent(utfFilename[1]);
  }

  const regularFilename = contentDisposition.match(
    /filename="?([^";]+)"?/
  );

  return regularFilename?.[1] ?? null;
}
