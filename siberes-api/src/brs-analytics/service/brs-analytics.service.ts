import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';

export type ChangeStatus = 'NAIK' | 'TURUN' | 'TETAP' | 'TIDAK_TERSEDIA';

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

export interface BrsAnalyticsResponse {
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

  history: Array<{
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
  }>;
}

interface RawMetricRow {
  jenisAkomodasi: number;
  kelasAkomodasi: number;

  mktj: NumericValue;
  mkts: NumericValue;
  mta: NumericValue;
  ta: NumericValue;
  mtnus: NumericValue;
  tnus: NumericValue;
}

type NumericValue =
  | number
  | string
  | {
      toString(): string;
    };

interface PeriodMetrics {
  available: boolean;
  tpkTotal: number | null;
  tpkByClassification: Record<string, number | null>;
  rlmtTotal: number | null;
  rlmtAsing: number | null;
  rlmtNusantara: number | null;
}

interface ClassificationDefinition {
  key: string;
  label: string;
  classes: number[] | null;
}

const CLASSIFICATIONS: ClassificationDefinition[] = [
  {
    key: 'BINTANG_1_2',
    label: 'Bintang 1 dan 2',
    classes: [1, 2],
  },
  {
    key: 'BINTANG_3',
    label: 'Bintang 3',
    classes: [3],
  },
  {
    key: 'BINTANG_4',
    label: 'Bintang 4',
    classes: [4],
  },
  {
    key: 'BINTANG_5',
    label: 'Bintang 5',
    classes: [5],
  },
  {
    key: 'TOTAL_BINTANG',
    label: 'Total hotel bintang',
    classes: null,
  },
];

@Injectable()
export class BrsAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async calculate(bulan: number, tahun: number): Promise<BrsAnalyticsResponse> {
    /*
     * Offset -12 sampai 0 menghasilkan 13 periode,
     * termasuk bulan yang sama tahun sebelumnya
     * hingga bulan berjalan.
     */
    const periods = Array.from({ length: 13 }, (_, index) =>
      this.shiftPeriod(bulan, tahun, index - 12),
    );

    const brsRecords = await this.prisma.brs.findMany({
      where: {
        jenisBrs: 'PARIWISATA',

        OR: periods.map((period) => ({
          bulan: period.bulan,
          tahun: period.tahun,
        })),
      },

      include: {
        dataUploads: {
          where: {
            status: 'ACTIVE',
          },
          orderBy: {
            version: 'desc',
          },
          take: 1,
          include: {
            rawData: true,
          },
        },
      },
    });

    const metricsByPeriod = new Map<string, PeriodMetrics>();

    periods.forEach((period) => {
      const brs = brsRecords.find(
        (record) =>
          record.bulan === period.bulan && record.tahun === period.tahun,
      );

      const rows = brs?.dataUploads[0]?.rawData ?? [];

      metricsByPeriod.set(
        this.periodKey(period.bulan, period.tahun),
        this.calculatePeriodMetrics(rows),
      );
    });

    const currentPeriod = {
      bulan,
      tahun,
    };

    const previousMonthPeriod = this.shiftPeriod(bulan, tahun, -1);

    const previousYearPeriod = this.shiftPeriod(bulan, tahun, -12);

    const current = this.getPeriodMetrics(metricsByPeriod, currentPeriod);

    const previousMonth = this.getPeriodMetrics(
      metricsByPeriod,
      previousMonthPeriod,
    );

    const previousYear = this.getPeriodMetrics(
      metricsByPeriod,
      previousYearPeriod,
    );

    const history = periods.map((period) => {
      const metrics = this.getPeriodMetrics(metricsByPeriod, period);

      return {
        bulan: period.bulan,
        tahun: period.tahun,
        available: metrics.available,

        tpkTotal: metrics.tpkTotal,

        tpkClassifications: CLASSIFICATIONS.map((classification) => ({
          key: classification.key,
          label: classification.label,
          value: metrics.tpkByClassification[classification.key] ?? null,
        })),

        rlmtTotal: metrics.rlmtTotal,
        rlmtAsing: metrics.rlmtAsing,
        rlmtNusantara: metrics.rlmtNusantara,
      };
    });

    const historyMonthsAvailable = history.filter(
      (item) => item.available,
    ).length;

    return {
      period: currentPeriod,

      availability: {
        currentAvailable: current.available,
        previousMonthAvailable: previousMonth.available,
        previousYearAvailable: previousYear.available,

        historyMonthsAvailable,
        historyMonthsRequired: 13,

        canGenerateDraft: current.available,

        canGenerateFinal: historyMonthsAvailable === 13,
      },

      tpk: {
        total: this.compareMetric(
          current.tpkTotal,
          previousMonth.tpkTotal,
          previousYear.tpkTotal,
        ),

        classifications: CLASSIFICATIONS.map((classification) => ({
          key: classification.key,
          label: classification.label,

          ...this.compareMetric(
            current.tpkByClassification[classification.key] ?? null,

            previousMonth.tpkByClassification[classification.key] ?? null,

            previousYear.tpkByClassification[classification.key] ?? null,
          ),
        })),
      },

      rlmt: {
        total: this.compareMetric(
          current.rlmtTotal,
          previousMonth.rlmtTotal,
          previousYear.rlmtTotal,
        ),

        asing: this.compareMetric(
          current.rlmtAsing,
          previousMonth.rlmtAsing,
          previousYear.rlmtAsing,
        ),

        nusantara: this.compareMetric(
          current.rlmtNusantara,
          previousMonth.rlmtNusantara,
          previousYear.rlmtNusantara,
        ),
      },

      history,
    };
  }

  private calculatePeriodMetrics(rows: RawMetricRow[]): PeriodMetrics {
    /*
     * jenisAkomodasi = 1 adalah hotel
     * klasifikasi bintang.
     */
    const starHotelRows = rows.filter((row) => row.jenisAkomodasi === 1);

    if (starHotelRows.length === 0) {
      return this.emptyPeriodMetrics();
    }

    const tpkByClassification: Record<string, number | null> = {};

    CLASSIFICATIONS.forEach((classification) => {
      const classificationRows =
        classification.classes === null
          ? starHotelRows
          : starHotelRows.filter((row) =>
              classification.classes?.includes(row.kelasAkomodasi),
            );

      tpkByClassification[classification.key] =
        this.calculateTpk(classificationRows);
    });

    const mta = this.sum(starHotelRows, 'mta');

    const ta = this.sum(starHotelRows, 'ta');

    const mtnus = this.sum(starHotelRows, 'mtnus');

    const tnus = this.sum(starHotelRows, 'tnus');

    return {
      available: true,

      tpkTotal: tpkByClassification.TOTAL_BINTANG ?? null,

      tpkByClassification,

      rlmtTotal: this.safeDivide(mta + mtnus, ta + tnus),

      rlmtAsing: this.safeDivide(mta, ta),

      rlmtNusantara: this.safeDivide(mtnus, tnus),
    };
  }

  private calculateTpk(rows: RawMetricRow[]): number | null {
    if (rows.length === 0) {
      return null;
    }

    const mktj = this.sum(rows, 'mktj');
    const mkts = this.sum(rows, 'mkts');

    if (mkts === 0) {
      return null;
    }

    return this.round((mktj / mkts) * 100);
  }

  private compareMetric(
    current: number | null,
    previousMonth: number | null,
    previousYear: number | null,
  ): MetricComparison {
    const mtmChange = this.difference(current, previousMonth);

    const yoyChange = this.difference(current, previousYear);

    return {
      current,
      previousMonth,
      previousYear,

      mtmChange,
      yoyChange,

      mtmStatus: this.getChangeStatus(mtmChange),

      yoyStatus: this.getChangeStatus(yoyChange),
    };
  }

  private difference(
    current: number | null,
    comparison: number | null,
  ): number | null {
    if (current === null || comparison === null) {
      return null;
    }

    return this.round(current - comparison);
  }

  private getChangeStatus(difference: number | null): ChangeStatus {
    if (difference === null) {
      return 'TIDAK_TERSEDIA';
    }

    if (difference > 0) {
      return 'NAIK';
    }

    if (difference < 0) {
      return 'TURUN';
    }

    return 'TETAP';
  }

  private safeDivide(numerator: number, denominator: number): number | null {
    if (denominator === 0) {
      return null;
    }

    return this.round(numerator / denominator);
  }

  private sum(
    rows: RawMetricRow[],
    field: 'mktj' | 'mkts' | 'mta' | 'ta' | 'mtnus' | 'tnus',
  ): number {
    return rows.reduce((total, row) => total + Number(row[field]), 0);
  }

  private shiftPeriod(bulan: number, tahun: number, offset: number) {
    const date = new Date(Date.UTC(tahun, bulan - 1 + offset, 1));

    return {
      bulan: date.getUTCMonth() + 1,
      tahun: date.getUTCFullYear(),
    };
  }

  private periodKey(bulan: number, tahun: number): string {
    return `${tahun}-${String(bulan).padStart(2, '0')}`;
  }

  private getPeriodMetrics(
    metrics: Map<string, PeriodMetrics>,
    period: {
      bulan: number;
      tahun: number;
    },
  ): PeriodMetrics {
    return (
      metrics.get(this.periodKey(period.bulan, period.tahun)) ??
      this.emptyPeriodMetrics()
    );
  }

  private emptyPeriodMetrics(): PeriodMetrics {
    const tpkByClassification: Record<string, number | null> = {};

    CLASSIFICATIONS.forEach((classification) => {
      tpkByClassification[classification.key] = null;
    });

    return {
      available: false,
      tpkTotal: null,
      tpkByClassification,
      rlmtTotal: null,
      rlmtAsing: null,
      rlmtNusantara: null,
    };
  }

  private round(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
