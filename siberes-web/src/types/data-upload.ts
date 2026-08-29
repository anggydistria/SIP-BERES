export interface ExcelPreviewRow {
  sourceRow: number;
  jenisAkomodasi: number;
  kelasAkomodasi: number;
  mktj: number;
  mkts: number;
  mta: number;
  ta: number;
  mtnus: number;
  tnus: number;
}

export interface ExcelRowError {
  sourceRow: number;
  message: string;
}

export interface ExcelPreviewResponse {
  sheetName: string;

  location: {
    provinceCode: string;
    regencyCode: string;
    name: string;
  };

  period: {
    label: string;
    bulan: number;
    tahun: number;
  };

  sourceTotalRows: number;
  totalRows: number;
  validRows: number;
  invalidRows: number;

  data: ExcelPreviewRow[];
  errors: ExcelRowError[];
}
