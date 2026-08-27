export type BrsStatus = 'DRAFT' | 'FINAL';

export interface Brs {
  id: number;
  jenisBrs: string;
  bulan: number;
  tahun: number;
  nomorBrs: string | null;
  tanggalPublikasi: string | null;
  status: BrsStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBrsPayload {
  jenisBrs: string;
  bulan: number;
  tahun: number;
  nomorBrs?: string;
  tanggalPublikasi?: string;
}
