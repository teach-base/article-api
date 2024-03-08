import { Controller, Get, Query } from '@nestjs/common';
import { TagService } from './tag.service';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { Uid } from 'src/account/decorators/uid.decorator';

@Controller('tag')
export class TagController {
  constructor(private readonly service: TagService) {}

  @Get()
  async listTags(
    @Query() paginationQuery: PaginationQueryDto,
    @Uid() uid: number,
  ) {
    return await this.service.listTag(paginationQuery, uid);
  }
}
