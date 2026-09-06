import { Type } from 'class-transformer';

import { IsInt, Max, Min } from 'class-validator';

export class UploadExcelPeriodDto {
  @Type(() => Number)
  @IsInt({
    message: 'Bulan harus berupa angka',
  })
  @Min(1, {
    message: 'Bulan minimal 1',
  })
  @Max(12, {
    message: 'Bulan maksimal 12',
  })
  bulan: number;

  @Type(() => Number)
  @IsInt({
    message: 'Tahun harus berupa angka',
  })
  @Min(2000, {
    message: 'Tahun minimal 2000',
  })
  @Max(2100, {
    message: 'Tahun maksimal 2100',
  })
  tahun: number;
}
