import { IsOptional, IsPositive } from 'class-validator';

export class PaginationQueryDto {
  @IsOptional()
  @IsPositive()
  page: number;

  @IsOptional()
  @IsPositive()
  page_size: number;
}
