export type ChangeStatus =
  | 'NAIK'
  | 'TURUN'
  | 'TETAP'
  | 'TIDAK_TERSEDIA';

export interface MetricComparison {
  current: number | null;
  previousMonth: number | null;
  previousYear: number | null;

  mtmChange: number | null;
  yoyChange: number | null;

  mtmStatus: ChangeStatus;
  yoyStatus: ChangeStatus;
}

export interface ClassificationComparison extends MetricComparison {
  key: string;
  label: string;
}

export interface BrsAnalytics {
  period: {
    bulan: number;
    tahun: number;
  };

  availability: {
    currentAvailable: boolean;
    previousMonthAvailable: boolean;
    previousYearAvailable: boolean;
    historyMonthsAvailable: number;
    historyMonthsRequired: number;
    canGenerateDraft: boolean;
    canGenerateFinal: boolean;
  };

  tpk: {
    total: MetricComparison;
    classifications: ClassificationComparison[];
  };

  rlmt: {
    total: MetricComparison;
    asing: MetricComparison;
    nusantara: MetricComparison;
  };

  history: BrsHistoryPeriod[];
}

export interface BrsHistoryPeriod {
  bulan: number;
  tahun: number;
  available: boolean;

  tpkTotal: number | null;

  tpkClassifications: Array<{
    key: string;
    label: string;
    value: number | null;
  }>;

  rlmtTotal: number | null;
  rlmtAsing: number | null;
  rlmtNusantara: number | null;
}

export interface BrsNarrative {
  period: {
    bulan: number;
    tahun: number;
    label: string;
  };

  highlights: string[];

  sections: {
    tpk: {
      title: string;
      paragraphs: string[];
    };

    rlmt: {
      title: string;
      paragraphs: string[];
    };
  };

  warnings: string[];

  readyForDraft: boolean;
  readyForFinal: boolean;
}

export interface BrsPreviewData {
  analytics: BrsAnalytics;
  narrative: BrsNarrative;
}
