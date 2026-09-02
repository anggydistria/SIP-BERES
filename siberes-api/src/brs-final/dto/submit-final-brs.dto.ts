import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class SubmitFinalBrsDto {
  @IsString()
  @IsNotEmpty()
  nomorBrs: string;

  @IsOptional()
  @IsDateString()
  tanggalPublikasi?: string;
}
