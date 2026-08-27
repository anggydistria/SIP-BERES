/* eslint-disable prettier/prettier */
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateBrsDto {
  @IsOptional()
  @IsString()
  jenisBrs?: string;

  @IsInt()
  @Min(1)
  @Max(12)
  bulan: number;

  @IsInt()
  @Min(2000)
  tahun: number;

  @IsOptional()
  @IsString()
  nomorBrs?: string;

  @IsOptional()
  @IsDateString()
  tanggalPublikasi?: string;
}
