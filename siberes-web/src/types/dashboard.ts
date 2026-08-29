export interface DashboardSummary {
  brs: {
    id: number;
    jenisBrs: string;
    bulan: number;
    tahun: number;
  };

  dataUpload: {
    id: number;
    version: number;
    originalName: string;
    rowCount: number;
  };

  indicators: {
    malamKamarTersedia: number;
    malamKamarTerjual: number;
    tamuAsing: number;
    tamuNusantara: number;
    tingkatPenghunianKamar: number;
    rataLamaMenginap: number;
    rataLamaMenginapAsing: number | null;
    rataLamaMenginapNusantara: number | null;
  };
}
