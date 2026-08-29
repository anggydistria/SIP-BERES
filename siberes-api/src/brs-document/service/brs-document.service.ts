import { Injectable, NotFoundException } from '@nestjs/common';
import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  HeadingLevel,
  PageBreak,
  PageNumber,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from 'docx';

import {
  BrsAnalyticsService,
  type BrsAnalyticsResponse,
  type MetricComparison,
} from '../../brs-analytics/service/brs-analytics.service';
import {
  BrsNarrativeService,
  type BrsNarrativeResponse,
} from '../../brs-analytics/service/brs-narrative.service';
import { PrismaService } from '../../prisma/prisma.service';

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

const TABLE_BORDERS = {
  top: {
    style: BorderStyle.SINGLE,
    size: 1,
    color: 'BFBFBF',
  },
  bottom: {
    style: BorderStyle.SINGLE,
    size: 1,
    color: 'BFBFBF',
  },
  left: {
    style: BorderStyle.SINGLE,
    size: 1,
    color: 'BFBFBF',
  },
  right: {
    style: BorderStyle.SINGLE,
    size: 1,
    color: 'BFBFBF',
  },
  insideHorizontal: {
    style: BorderStyle.SINGLE,
    size: 1,
    color: 'D9D9D9',
  },
  insideVertical: {
    style: BorderStyle.SINGLE,
    size: 1,
    color: 'D9D9D9',
  },
};

export interface GeneratedBrsDocument {
  buffer: Buffer;
  filename: string;
}

@Injectable()
export class BrsDocumentService {
  constructor(
    private readonly prisma: PrismaService,

    private readonly analyticsService: BrsAnalyticsService,

    private readonly narrativeService: BrsNarrativeService,
  ) {}

  async generate(bulan: number, tahun: number): Promise<GeneratedBrsDocument> {
    const brs = await this.prisma.brs.findUnique({
      where: {
        jenisBrs_bulan_tahun: {
          jenisBrs: 'PARIWISATA',
          bulan,
          tahun,
        },
      },
    });

    if (!brs) {
      throw new NotFoundException(
        `BRS periode ${bulan}/${tahun} tidak ditemukan`,
      );
    }

    const [analytics, narrative] = await Promise.all([
      this.analyticsService.calculate(bulan, tahun),

      this.narrativeService.build(bulan, tahun),
    ]);

    if (!analytics.availability.currentAvailable) {
      throw new NotFoundException('Data bulan berjalan belum tersedia');
    }

    const periodLabel = `${MONTH_NAMES[bulan - 1]} ${tahun}`;

    const document = new Document({
      creator: 'SIBERES',
      title: `Perkembangan Pariwisata Kota Samarinda ${periodLabel}`,

      description:
        'Berita Resmi Statistik Perkembangan Pariwisata Kota Samarinda',

      styles: {
        default: {
          document: {
            run: {
              font: 'Arial',
              size: 22,
              color: '262626',
            },

            paragraph: {
              spacing: {
                line: 276,
                after: 120,
              },
            },
          },
        },

        paragraphStyles: [
          {
            id: 'BRSHeading1',
            name: 'BRS Heading 1',
            basedOn: 'Normal',
            next: 'Normal',
            quickFormat: true,

            run: {
              font: 'Arial',
              size: 28,
              bold: true,
              color: 'E66A21',
            },

            paragraph: {
              spacing: {
                before: 300,
                after: 140,
              },
            },
          },

          {
            id: 'BRSHeading2',
            name: 'BRS Heading 2',
            basedOn: 'Normal',
            next: 'Normal',
            quickFormat: true,

            run: {
              font: 'Arial',
              size: 24,
              bold: true,
              color: '333333',
            },

            paragraph: {
              spacing: {
                before: 220,
                after: 100,
              },
            },
          },
        ],
      },

      sections: [
        {
          properties: {
            page: {
              size: {
                width: 11906,
                height: 16838,
              },

              margin: {
                top: 1134,
                right: 1134,
                bottom: 1134,
                left: 1134,
              },
            },
          },

          footers: {
            default: this.createFooter(periodLabel, brs.nomorBrs),
          },

          children: [
            ...this.createCover(
              periodLabel,
              brs.nomorBrs,
              brs.tanggalPublikasi,
              narrative,
            ),

            new Paragraph({
              children: [new PageBreak()],
            }),

            ...this.createSummarySection(narrative),

            ...this.createTpkSection(analytics, narrative),

            ...this.createRlmtSection(analytics, narrative),

            ...this.createWarningsSection(narrative),
          ],
        },
      ],
    });

    const buffer = await Packer.toBuffer(document);

    const safePeriod = periodLabel.replaceAll(' ', '-').toLowerCase();

    return {
      buffer,
      filename: `BRS-Pariwisata-Kota-Samarinda-${safePeriod}.docx`,
    };
  }

  private createCover(
    periodLabel: string,
    nomorBrs: string | null,
    tanggalPublikasi: Date | null,
    narrative: BrsNarrativeResponse,
  ) {
    return [
      new Paragraph({
        alignment: AlignmentType.CENTER,

        children: [
          new TextRun({
            text: 'BADAN PUSAT STATISTIK',
            bold: true,
            size: 24,
            color: '4F81BD',
          }),
        ],
      }),

      new Paragraph({
        alignment: AlignmentType.CENTER,

        children: [
          new TextRun({
            text: 'KOTA SAMARINDA',
            bold: true,
            size: 24,
            color: '4F81BD',
          }),
        ],
      }),

      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: {
          before: 900,
          after: 180,
        },

        children: [
          new TextRun({
            text: 'PERKEMBANGAN PARIWISATA',
            bold: true,
            size: 38,
            color: 'E66A21',
          }),
        ],
      }),

      new Paragraph({
        alignment: AlignmentType.CENTER,

        children: [
          new TextRun({
            text: 'KOTA SAMARINDA',
            bold: true,
            size: 34,
            color: 'E66A21',
          }),
        ],
      }),

      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: {
          after: 500,
        },

        children: [
          new TextRun({
            text: periodLabel.toUpperCase(),
            bold: true,
            size: 34,
            color: 'E66A21',
          }),
        ],
      }),

      new Paragraph({
        alignment: AlignmentType.CENTER,

        children: [
          new TextRun({
            text: `Berita Resmi Statistik ${
              nomorBrs ?? 'Nomor BRS belum ditentukan'
            }`,
            size: 20,
          }),
        ],
      }),

      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: {
          after: 700,
        },

        children: [
          new TextRun({
            text: tanggalPublikasi
              ? this.formatDate(tanggalPublikasi)
              : 'Tanggal rilis belum ditentukan',
            size: 20,
          }),
        ],
      }),

      new Paragraph({
        spacing: {
          before: 240,
          after: 180,
        },

        children: [
          new TextRun({
            text: 'Ringkasan Utama',
            bold: true,
            size: 26,
            color: 'E66A21',
          }),
        ],
      }),

      ...narrative.highlights.map(
        (highlight) =>
          new Paragraph({
            bullet: {
              level: 0,
            },

            children: [
              new TextRun({
                text: highlight,
                size: 22,
              }),
            ],
          }),
      ),
    ];
  }

  private createSummarySection(narrative: BrsNarrativeResponse) {
    return [
      new Paragraph({
        style: 'BRSHeading1',

        children: [new TextRun('Ringkasan Perkembangan Pariwisata')],
      }),

      ...narrative.highlights.map((highlight) => this.bodyParagraph(highlight)),
    ];
  }

  private createTpkSection(
    analytics: BrsAnalyticsResponse,
    narrative: BrsNarrativeResponse,
  ) {
    return [
      new Paragraph({
        style: 'BRSHeading1',

        children: [new TextRun('1. Tingkat Penghunian Kamar Hotel')],
      }),

      ...narrative.sections.tpk.paragraphs.map((paragraph) =>
        this.bodyParagraph(paragraph),
      ),

      new Paragraph({
        style: 'BRSHeading2',

        children: [
          new TextRun(
            'Tabel 1. TPK Hotel Klasifikasi Bintang di Kota Samarinda',
          ),
        ],
      }),

      this.createTpkHistoryTable(analytics),
    ];
  }

  private createRlmtSection(
    analytics: BrsAnalyticsResponse,
    narrative: BrsNarrativeResponse,
  ) {
    return [
      new Paragraph({
        style: 'BRSHeading1',

        children: [
          new TextRun(
            '2. Rata-Rata Lama Menginap Tamu Hotel Klasifikasi Bintang',
          ),
        ],
      }),

      ...narrative.sections.rlmt.paragraphs.map((paragraph) =>
        this.bodyParagraph(paragraph),
      ),

      new Paragraph({
        style: 'BRSHeading2',

        children: [new TextRun('Tabel 2. Rata-Rata Lama Menginap Tamu')],
      }),

      this.createRlmtTable(analytics),
    ];
  }

  private createTpkHistoryTable(analytics: BrsAnalyticsResponse): Table {
    const header = new TableRow({
      tableHeader: true,

      children: [
        'Bulan',
        'Bintang 1 dan 2',
        'Bintang 3',
        'Bintang 4',
        'Bintang 5',
        'Total',
      ].map((text) => this.tableCell(text, true, 'F4B183')),
    });

    const rows = analytics.history.map((period) => {
      const values = new Map(
        period.tpkClassifications.map((item) => [item.key, item.value]),
      );

      return new TableRow({
        children: [
          this.tableCell(`${MONTH_NAMES[period.bulan - 1]} ${period.tahun}`),

          this.tableCell(this.formatNumber(values.get('BINTANG_1_2') ?? null)),

          this.tableCell(this.formatNumber(values.get('BINTANG_3') ?? null)),

          this.tableCell(this.formatNumber(values.get('BINTANG_4') ?? null)),

          this.tableCell(this.formatNumber(values.get('BINTANG_5') ?? null)),

          this.tableCell(this.formatNumber(period.tpkTotal), true),
        ],
      });
    });
    const comparisonByKey = new Map(
      analytics.tpk.classifications.map((item) => [item.key, item]),
    );

    const previousMonth = this.shiftPeriod(
      analytics.period.bulan,
      analytics.period.tahun,
      -1,
    );

    const previousYear = this.shiftPeriod(
      analytics.period.bulan,
      analytics.period.tahun,
      -12,
    );

    const changeRows = [
      this.tpkChangeRow(
        `Perubahan terhadap ${
          MONTH_NAMES[previousMonth.bulan - 1]
        } ${previousMonth.tahun} (poin persen)`,
        comparisonByKey,
        'mtmChange',
      ),

      this.tpkChangeRow(
        `Perubahan terhadap ${
          MONTH_NAMES[previousYear.bulan - 1]
        } ${previousYear.tahun} (poin persen)`,
        comparisonByKey,
        'yoyChange',
      ),
    ];
    return new Table({
      width: {
        size: 100,
        type: WidthType.PERCENTAGE,
      },

      borders: TABLE_BORDERS,

      rows: [header, ...rows, ...changeRows],
    });
  }
  private tpkChangeRow(
    label: string,
    comparisons: Map<string, MetricComparison>,
    field: 'mtmChange' | 'yoyChange',
  ): TableRow {
    const keys = [
      'BINTANG_1_2',
      'BINTANG_3',
      'BINTANG_4',
      'BINTANG_5',
      'TOTAL_BINTANG',
    ];

    return new TableRow({
      children: [
        this.tableCell(label, true, 'FFF2CC'),

        ...keys.map((key) =>
          this.tableCell(
            this.formatNumber(comparisons.get(key)?.[field] ?? null),
            true,
            'FFF2CC',
          ),
        ),
      ],
    });
  }
  private createRlmtTable(analytics: BrsAnalyticsResponse): Table {
    const header = new TableRow({
      tableHeader: true,

      children: [
        'Asal Tamu',
        'Tahun Lalu',
        'Bulan Sebelumnya',
        'Bulan Berjalan',
        'YoY',
        'MtM',
      ].map((text) => this.tableCell(text, true, 'F4B183')),
    });

    const rows = [
      this.rlmtRow('Tamu Asing', analytics.rlmt.asing),

      this.rlmtRow('Tamu Nusantara', analytics.rlmt.nusantara),

      this.rlmtRow('Total', analytics.rlmt.total, true),
    ];

    return new Table({
      width: {
        size: 100,
        type: WidthType.PERCENTAGE,
      },

      borders: TABLE_BORDERS,

      rows: [header, ...rows],
    });
  }

  private rlmtRow(
    label: string,
    metric: MetricComparison,
    bold = false,
  ): TableRow {
    return new TableRow({
      children: [
        this.tableCell(label, bold),

        this.tableCell(this.formatNumber(metric.previousYear), bold),

        this.tableCell(this.formatNumber(metric.previousMonth), bold),

        this.tableCell(this.formatNumber(metric.current), bold),

        this.tableCell(this.formatSignedNumber(metric.yoyChange), bold),

        this.tableCell(this.formatSignedNumber(metric.mtmChange), bold),
      ],
    });
  }

  private createWarningsSection(narrative: BrsNarrativeResponse) {
    if (narrative.warnings.length === 0) {
      return [];
    }

    return [
      new Paragraph({
        style: 'BRSHeading2',

        children: [new TextRun('Catatan Kelengkapan Data')],
      }),

      ...narrative.warnings.map(
        (warning) =>
          new Paragraph({
            bullet: {
              level: 0,
            },

            children: [
              new TextRun({
                text: warning,
                italics: true,
                color: '7F6000',
              }),
            ],
          }),
      ),
    ];
  }

  private createFooter(periodLabel: string, nomorBrs: string | null): Footer {
    return new Footer({
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,

          children: [
            new TextRun({
              text: `Perkembangan Pariwisata Kota Samarinda ${periodLabel}`,
              size: 18,
              color: '666666',
            }),

            new TextRun({
              text: ` | ${nomorBrs ?? 'DRAFT'} | Halaman `,
              size: 18,
              color: '666666',
            }),

            new TextRun({
              children: [PageNumber.CURRENT],
              size: 18,
              color: '666666',
            }),
          ],
        }),
      ],
    });
  }

  private bodyParagraph(text: string): Paragraph {
    return new Paragraph({
      alignment: AlignmentType.JUSTIFIED,

      spacing: {
        after: 160,
        line: 300,
      },

      children: [
        new TextRun({
          text,
          size: 22,
        }),
      ],
    });
  }

  private tableCell(text: string, bold = false, fill?: string): TableCell {
    return new TableCell({
      verticalAlign: VerticalAlign.CENTER,

      shading: fill
        ? {
            fill,
          }
        : undefined,

      margins: {
        top: 100,
        bottom: 100,
        left: 100,
        right: 100,
      },

      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,

          children: [
            new TextRun({
              text,
              bold,
              size: 18,
            }),
          ],
        }),
      ],
    });
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

  private formatSignedNumber(value: number | null): string {
    if (value === null) {
      return '–';
    }

    const formatted = this.formatNumber(Math.abs(value));

    if (value > 0) {
      return `+${formatted}`;
    }

    if (value < 0) {
      return `-${formatted}`;
    }

    return formatted;
  }

  private formatDate(value: Date): string {
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(value);
  }
  private shiftPeriod(bulan: number, tahun: number, offset: number) {
    const date = new Date(Date.UTC(tahun, bulan - 1 + offset, 1));

    return {
      bulan: date.getUTCMonth() + 1,
      tahun: date.getUTCFullYear(),
    };
  }
}
