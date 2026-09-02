import { IsNotEmpty, IsString } from 'class-validator';

export class RejectFinalBrsDto {
  @IsString()
  @IsNotEmpty()
  note: string;
}
