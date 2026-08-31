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

export interface BrsPaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface BrsListResponse {
  data: Brs[];
  meta: BrsPaginationMeta;
}

export interface BrsListParams {
  page?: number;
  limit?: number;
  bulan?: number;
  tahun?: number;
}

export interface CreateBrsPayload {
  jenisBrs: string;
  bulan: number;
  tahun: number;
  nomorBrs?: string;
  tanggalPublikasi?: string;
}
