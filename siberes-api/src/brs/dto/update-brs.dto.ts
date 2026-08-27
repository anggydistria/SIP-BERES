import { PartialType } from '@nestjs/mapped-types';
import { CreateBrsDto } from './create-brs.dto';

export class UpdateBrsDto extends PartialType(CreateBrsDto) {}
