import {
  ArrayNotEmpty,
  IsArray,
  IsIn,
  IsNotEmpty,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

const ALLOWED_ROLES = ['ADMIN', 'KETUA_BRS', 'PENGELOLA'] as const;

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-zA-Z0-9._-]+$/, {
    message:
      'Username hanya boleh berisi huruf, angka, titik, garis bawah, dan tanda hubung',
  })
  username: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsIn(ALLOWED_ROLES, {
    each: true,
  })
  roles: string[];
}
