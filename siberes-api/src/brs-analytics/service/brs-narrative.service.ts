import { Injectable } from '@nestjs/common';

import {
  BrsAnalyticsService,
  type BrsAnalyticsResponse,
  type ChangeStatus,
  type MetricComparison,
} from './brs-analytics.service';

export interface BrsNarrativeResponse {
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

const MONTH_NAMES = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

@Injectable()
export class BrsNarrativeService {
  constructor(private readonly analyticsService: BrsAnalyticsService) {}

  async build(bulan: number, tahun: number): Promise<BrsNarrativeResponse> {
    const analytics = await this.analyticsService.calculate(bulan, tahun);

    const periodLabel = this.periodLabel(bulan, tahun);

    const previousMonth = this.shiftPeriod(bulan, tahun, -1);

    const previousYear = this.shiftPeriod(bulan, tahun, -12);

    const previousMonthLabel = this.periodLabel(
      previousMonth.bulan,
      previousMonth.tahun,
    );

    const previousYearLabel = this.periodLabel(
      previousYear.bulan,
      previousYear.tahun,
    );

    const warnings = this.buildWarnings(analytics);

    return {
      period: {
        bulan,
        tahun,
        label: periodLabel,
      },

      highlights: this.buildHighlights(analytics, periodLabel),

      sections: {
        tpk: {
          title: 'Tingkat Penghunian Kamar Hotel Klasifikasi Bintang',

          paragraphs: this.buildTpkParagraphs(
            analytics,
            periodLabel,
            previousMonthLabel,
            previousYearLabel,
          ),
        },

        rlmt: {
          title: 'Rata-Rata Lama Menginap Tamu Hotel Klasifikasi Bintang',

          paragraphs: this.buildRlmtParagraphs(
            analytics,
            periodLabel,
            previousMonthLabel,
            previousYearLabel,
          ),
        },
      },

      warnings,

      readyForDraft: analytics.availability.canGenerateDraft,

      readyForFinal: analytics.availability.canGenerateFinal,
    };
  }

  private buildHighlights(
    analytics: BrsAnalyticsResponse,
    periodLabel: string,
  ): string[] {
    const highlights: string[] = [];

    const tpk = analytics.tpk.total.current;

    if (tpk !== null) {
      const changes = this.highlightChanges(analytics.tpk.total);

      highlights.push(
        `Tingkat Penghunian Kamar (TPK) hotel klasifikasi bintang di Kota Samarinda pada ${periodLabel} sebesar ${this.formatNumber(tpk)} persen${changes}.`,
      );
    }

    const rlmt = analytics.rlmt.total.current;

    if (rlmt !== null) {
      const changes = this.highlightChanges(analytics.rlmt.total);

      highlights.push(
        `Rata-rata lama menginap tamu hotel klasifikasi bintang di Kota Samarinda pada ${periodLabel} mencapai ${this.formatNumber(rlmt)} hari${changes}.`,
      );
    }

    return highlights;
  }

  private buildTpkParagraphs(
    analytics: BrsAnalyticsResponse,
    periodLabel: string,
    previousMonthLabel: string,
    previousYearLabel: string,
  ): string[] {
    const paragraphs: string[] = [];
    const total = analytics.tpk.total;

    if (total.current === null) {
      return [
        `Data Tingkat Penghunian Kamar hotel klasifikasi bintang untuk ${periodLabel} belum tersedia.`,
      ];
    }

    let opening = `Pada ${periodLabel}, Tingkat Penghunian Kamar (TPK) hotel klasifikasi bintang di Kota Samarinda sebesar ${this.formatNumber(total.current)} persen. `;

    opening +=
      'Hal ini menunjukkan persentase kamar hotel klasifikasi bintang yang terjual atau terpakai dibandingkan dengan seluruh kamar yang tersedia.';

    paragraphs.push(opening);

    paragraphs.push(
      this.buildComparisonParagraph(
        'TPK hotel klasifikasi bintang',
        total,
        previousMonthLabel,
        previousYearLabel,
        'persen',
        'poin',
      ),
    );

    const availableClassifications = analytics.tpk.classifications.filter(
      (item) => item.key !== 'TOTAL_BINTANG' && item.current !== null,
    );

    if (availableClassifications.length > 0) {
      const highest = availableClassifications.reduce((result, item) =>
        (item.current ?? 0) > (result.current ?? 0) ? item : result,
      );

      const lowest = availableClassifications.reduce((result, item) =>
        (item.current ?? 0) < (result.current ?? 0) ? item : result,
      );

      paragraphs.push(
        `Jika dilihat menurut klasifikasi hotel, ${highest.label.toLowerCase()} mencatat TPK tertinggi pada ${periodLabel}, yaitu sebesar ${this.formatNumber(highest.current)} persen. Sementara itu, TPK terendah terjadi pada ${lowest.label.toLowerCase()}, yaitu sebesar ${this.formatNumber(lowest.current)} persen.`,
      );
    }

    availableClassifications.forEach((classification) => {
      paragraphs.push(
        this.buildClassificationParagraph(
          classification.label,
          classification,
          periodLabel,
          previousMonthLabel,
          previousYearLabel,
        ),
      );
    });
    const historyExtremes = this.historyExtremes(
      analytics.history
        .filter((item) => item.available && item.tpkTotal !== null)
        .map((item) => ({
          label: this.periodLabel(item.bulan, item.tahun),
          value: item.tpkTotal as number,
        })),
    );

    if (analytics.availability.canGenerateFinal && historyExtremes) {
      const firstPeriod = analytics.history[0];

      paragraphs.push(
        `Selama periode ${this.periodLabel(
          firstPeriod.bulan,
          firstPeriod.tahun,
        )} sampai dengan ${periodLabel}, TPK hotel klasifikasi bintang tertinggi terjadi pada ${
          historyExtremes.highest.label
        }, yaitu sebesar ${this.formatNumber(
          historyExtremes.highest.value,
        )} persen. TPK terendah terjadi pada ${
          historyExtremes.lowest.label
        }, yaitu sebesar ${this.formatNumber(
          historyExtremes.lowest.value,
        )} persen.`,
      );
    }
    if (analytics.availability.canGenerateFinal) {
      const foreignExtremes = this.historyExtremes(
        analytics.history
          .filter((item) => item.rlmtAsing !== null)
          .map((item) => ({
            label: this.periodLabel(item.bulan, item.tahun),
            value: item.rlmtAsing as number,
          })),
      );

      const domesticExtremes = this.historyExtremes(
        analytics.history
          .filter((item) => item.rlmtNusantara !== null)
          .map((item) => ({
            label: this.periodLabel(item.bulan, item.tahun),
            value: item.rlmtNusantara as number,
          })),
      );

      if (foreignExtremes && domesticExtremes) {
        const firstPeriod = analytics.history[0];

        paragraphs.push(
          `Selama periode ${this.periodLabel(
            firstPeriod.bulan,
            firstPeriod.tahun,
          )} sampai dengan ${periodLabel}, rata-rata lama menginap tamu asing tertinggi terjadi pada ${
            foreignExtremes.highest.label
          }, yaitu ${this.formatNumber(
            foreignExtremes.highest.value,
          )} hari, dan terendah pada ${
            foreignExtremes.lowest.label
          }, yaitu ${this.formatNumber(
            foreignExtremes.lowest.value,
          )} hari. Untuk tamu nusantara, nilai tertinggi terjadi pada ${
            domesticExtremes.highest.label
          }, yaitu ${this.formatNumber(
            domesticExtremes.highest.value,
          )} hari, dan terendah pada ${
            domesticExtremes.lowest.label
          }, yaitu ${this.formatNumber(domesticExtremes.lowest.value)} hari.`,
        );
      }
    }
    return paragraphs;
  }

  private buildClassificationParagraph(
    label: string,
    metric: MetricComparison,
    periodLabel: string,
    previousMonthLabel: string,
    previousYearLabel: string,
  ): string {
    let paragraph = `TPK hotel ${label.toLowerCase()} pada ${periodLabel} tercatat sebesar ${this.formatNumber(metric.current)} persen.`;

    if (metric.mtmChange !== null && metric.previousMonth !== null) {
      paragraph += ` Angka tersebut ${this.statusPhrase(metric.mtmStatus)} sebesar ${this.formatAbsolute(metric.mtmChange)} poin dibandingkan ${previousMonthLabel}, yang tercatat sebesar ${this.formatNumber(metric.previousMonth)} persen.`;
    }

    if (metric.yoyChange !== null && metric.previousYear !== null) {
      paragraph += ` Jika dibandingkan dengan ${previousYearLabel}, TPK hotel ${label.toLowerCase()} ${this.statusPhrase(metric.yoyStatus)} sebesar ${this.formatAbsolute(metric.yoyChange)} poin dari nilai ${this.formatNumber(metric.previousYear)} persen.`;
    }

    return paragraph;
  }

  private buildRlmtParagraphs(
    analytics: BrsAnalyticsResponse,
    periodLabel: string,
    previousMonthLabel: string,
    previousYearLabel: string,
  ): string[] {
    const paragraphs: string[] = [];

    const total = analytics.rlmt.total;
    const asing = analytics.rlmt.asing;
    const nusantara = analytics.rlmt.nusantara;

    if (total.current === null) {
      return [
        `Data rata-rata lama menginap tamu hotel klasifikasi bintang untuk ${periodLabel} belum tersedia.`,
      ];
    }

    paragraphs.push(
      `Secara umum, rata-rata lama menginap tamu hotel klasifikasi bintang di Kota Samarinda pada ${periodLabel} mencapai ${this.formatNumber(total.current)} hari.`,
    );

    paragraphs.push(
      this.buildComparisonParagraph(
        'Rata-rata lama menginap tamu',
        total,
        previousMonthLabel,
        previousYearLabel,
        'hari',
        'poin',
      ),
    );

    const details: string[] = [];

    if (asing.current !== null) {
      details.push(
        `tamu asing mencapai ${this.formatNumber(asing.current)} hari`,
      );
    }

    if (nusantara.current !== null) {
      details.push(
        `tamu nusantara mencapai ${this.formatNumber(nusantara.current)} hari`,
      );
    }

    if (details.length > 0) {
      paragraphs.push(
        `Jika diperinci menurut asal tamu, ${details.join(', sedangkan ')}.`,
      );
    }

    if (asing.mtmChange !== null || nusantara.mtmChange !== null) {
      paragraphs.push(
        this.buildGuestComparisonParagraph(
          asing,
          nusantara,
          previousMonthLabel,
          'MtM',
        ),
      );
    }

    if (asing.yoyChange !== null || nusantara.yoyChange !== null) {
      paragraphs.push(
        this.buildGuestComparisonParagraph(
          asing,
          nusantara,
          previousYearLabel,
          'YoY',
        ),
      );
    }

    return paragraphs;
  }

  private buildComparisonParagraph(
    subject: string,
    metric: MetricComparison,
    previousMonthLabel: string,
    previousYearLabel: string,
    valueUnit: string,
    changeUnit: string,
  ): string {
    let paragraph = '';

    if (metric.mtmChange !== null && metric.previousMonth !== null) {
      paragraph += `${subject} ${this.statusPhrase(metric.mtmStatus)} sebesar ${this.formatAbsolute(metric.mtmChange)} ${changeUnit} dibandingkan ${previousMonthLabel}, yang tercatat sebesar ${this.formatNumber(metric.previousMonth)} ${valueUnit}.`;
    } else {
      paragraph += `Data pembanding ${previousMonthLabel} belum tersedia.`;
    }

    if (metric.yoyChange !== null && metric.previousYear !== null) {
      paragraph += ` Jika dibandingkan dengan ${previousYearLabel}, indikator tersebut ${this.statusPhrase(metric.yoyStatus)} sebesar ${this.formatAbsolute(metric.yoyChange)} ${changeUnit} dari nilai ${this.formatNumber(metric.previousYear)} ${valueUnit}.`;
    } else {
      paragraph += ` Data pembanding ${previousYearLabel} belum tersedia.`;
    }

    return paragraph;
  }

  private buildGuestComparisonParagraph(
    asing: MetricComparison,
    nusantara: MetricComparison,
    comparisonLabel: string,
    comparisonType: 'MtM' | 'YoY',
  ): string {
    const foreignChange =
      comparisonType === 'MtM' ? asing.mtmChange : asing.yoyChange;

    const foreignStatus =
      comparisonType === 'MtM' ? asing.mtmStatus : asing.yoyStatus;

    const domesticChange =
      comparisonType === 'MtM' ? nusantara.mtmChange : nusantara.yoyChange;

    const domesticStatus =
      comparisonType === 'MtM' ? nusantara.mtmStatus : nusantara.yoyStatus;

    const sentences: string[] = [];

    if (foreignChange !== null) {
      sentences.push(
        `rata-rata lama menginap tamu asing ${this.statusPhrase(foreignStatus)} sebesar ${this.formatAbsolute(foreignChange)} poin`,
      );
    }

    if (domesticChange !== null) {
      sentences.push(
        `rata-rata lama menginap tamu nusantara ${this.statusPhrase(domesticStatus)} sebesar ${this.formatAbsolute(domesticChange)} poin`,
      );
    }

    return `Jika dibandingkan dengan ${comparisonLabel}, ${sentences.join(', sedangkan ')}.`;
  }

  private buildWarnings(analytics: BrsAnalyticsResponse): string[] {
    const warnings: string[] = [];

    if (!analytics.availability.currentAvailable) {
      warnings.push('Data bulan berjalan belum tersedia.');
    }

    if (!analytics.availability.previousMonthAvailable) {
      warnings.push(
        'Data bulan sebelumnya belum tersedia sehingga perubahan MtM belum dapat dihitung.',
      );
    }

    if (!analytics.availability.previousYearAvailable) {
      warnings.push(
        'Data bulan yang sama tahun sebelumnya belum tersedia sehingga perubahan YoY belum dapat dihitung.',
      );
    }

    if (!analytics.availability.canGenerateFinal) {
      warnings.push(
        `Riwayat baru tersedia ${analytics.availability.historyMonthsAvailable} dari 13 bulan yang dibutuhkan.`,
      );
    }

    return warnings;
  }

  private highlightChanges(metric: MetricComparison): string {
    const changes: string[] = [];

    if (metric.mtmChange !== null) {
      changes.push(
        `${this.statusPhrase(metric.mtmStatus)} ${this.formatAbsolute(
          metric.mtmChange,
        )} poin secara month-to-month`,
      );
    }

    if (metric.yoyChange !== null) {
      changes.push(
        `${this.statusPhrase(metric.yoyStatus)} ${this.formatAbsolute(
          metric.yoyChange,
        )} poin secara year-on-year`,
      );
    }

    return changes.length > 0 ? `, ${changes.join(', dan ')}` : '';
  }

  private historyExtremes(
    values: Array<{
      label: string;
      value: number;
    }>,
  ): {
    highest: {
      label: string;
      value: number;
    };
    lowest: {
      label: string;
      value: number;
    };
  } | null {
    if (values.length === 0) {
      return null;
    }

    return {
      highest: values.reduce((result, item) =>
        item.value > result.value ? item : result,
      ),

      lowest: values.reduce((result, item) =>
        item.value < result.value ? item : result,
      ),
    };
  }
  private statusPhrase(status: ChangeStatus): string {
    switch (status) {
      case 'NAIK':
        return 'mengalami kenaikan';

      case 'TURUN':
        return 'mengalami penurunan';

      case 'TETAP':
        return 'tidak mengalami perubahan';

      default:
        return 'belum dapat dibandingkan';
    }
  }

  private formatNumber(value: number | null): string {
    if (value === null) {
      return '–';
    }

    return new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  private formatAbsolute(value: number): string {
    return this.formatNumber(Math.abs(value));
  }

  private periodLabel(bulan: number, tahun: number): string {
    return `${MONTH_NAMES[bulan - 1]} ${tahun}`;
  }

  private shiftPeriod(bulan: number, tahun: number, offset: number) {
    const date = new Date(Date.UTC(tahun, bulan - 1 + offset, 1));

    return {
      bulan: date.getUTCMonth() + 1,
      tahun: date.getUTCFullYear(),
    };
  }
}
