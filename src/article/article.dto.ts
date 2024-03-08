import { IntersectionType, PartialType, PickType } from '@nestjs/mapped-types';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsNumber,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';

class CommonArticleDto {
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  readonly title: string;

  @IsNumber()
  readonly id: number;

  @IsNumber()
  readonly pid: number;

  @IsString()
  readonly text: string;

  @ArrayMaxSize(6)
  @MaxLength(20, { each: true })
  @MinLength(1, { each: true })
  @IsString({ each: true })
  readonly tags: string[];

  @IsNumber()
  tag_id: number;

  @IsString()
  kw: string;

  @IsNumber()
  like: number;

  @ArrayMinSize(1)
  @IsNumber({ allowNaN: false, allowInfinity: false }, { each: true })
  readonly ids: number[];
}

export class CreateArticleDto extends IntersectionType(
  PickType(CommonArticleDto, ['title', 'text', 'tags']),
  PartialType(PickType(CommonArticleDto, ['pid'])),
) {}

export class CreateArticleFolderDto extends IntersectionType(
  PickType(CommonArticleDto, ['title', 'tags']),
  PartialType(PickType(CommonArticleDto, ['pid'])),
) {}

export class ListArticleQueryDto extends PartialType(
  IntersectionType(
    PickType(CommonArticleDto, ['pid']),
    PickType(PaginationQueryDto, ['page', 'page_size']),
  ),
) {}

export class SearchArticleQueryDto extends IntersectionType(
  PickType(CommonArticleDto, ['kw']),
  PickType(PaginationQueryDto, ['page', 'page_size']),
) {}

export class UpdateArticleDto extends PartialType(
  PickType(CommonArticleDto, ['title', 'text', 'tags']),
) {}

export class MoveArticleDto extends PickType(CommonArticleDto, [
  'ids',
  'pid',
]) {}

export class LikeArticleDto extends PickType(CommonArticleDto, [
  'id',
  'like',
]) {}
