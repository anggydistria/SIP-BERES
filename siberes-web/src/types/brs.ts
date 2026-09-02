export type BrsStatus =
  | 'DRAFT'
  | 'DRAFT_READY'
  | 'FINAL_SUBMITTED'
  | 'FINAL_REJECTED'
  | 'FINAL';

export type BrsReviewDecision = 'APPROVED' | 'REJECTED';

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

export interface BrsPerson {
  id: number;
  name: string;
  username: string;
}

export interface ActiveExcelUpload {
  id: number;
  originalName: string;
  version: number;
  rowCount: number;
  size: number | null;
  uploadedAt: string;
  processedAt: string | null;
}

export interface FinalSubmission {
  id: number;
  originalName: string;
  size: number;
  proposedNomorBrs: string;
  proposedTanggalPublikasi: string | null;
  version: number;
  submittedAt: string;
  submittedBy: BrsPerson;
}

export interface BrsReviewHistory {
  id: number;
  submissionVersion: number;
  originalName: string;
  proposedNomorBrs: string;
  proposedTanggalPublikasi: string | null;
  decision: BrsReviewDecision;
  note: string | null;
  submittedAt: string;
  reviewedAt: string;
  submittedBy: BrsPerson;
  reviewedBy: BrsPerson;
}

export interface BrsFinalFile {
  id: number;
  originalName: string;
  size: number;
  approvedAt: string;
  approvedBy: BrsPerson;
}

export interface BrsDetail extends Brs {
  dataUploads: ActiveExcelUpload[];
  finalSubmission: FinalSubmission | null;
  reviewHistories: BrsReviewHistory[];
  finalFile: BrsFinalFile | null;
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
