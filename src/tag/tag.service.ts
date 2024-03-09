import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { Tag } from 'src/entities/tag.entity';
import { Repository } from 'typeorm';

@Injectable()
export class TagService {
  constructor(
    @InjectRepository(Tag)
    private readonly repository: Repository<Tag>,
  ) {}

  async listTag(paginationQuery: PaginationQueryDto, uid: number) {
    const { page = 1, page_size = 100 } = paginationQuery;
    const total = await this.repository.count();
    const total_page = Math.ceil(total / page_size);
    const list = await this.repository.find({
      where: {
        uid,
      },
      take: page_size,
      skip: (page - 1) * page_size,
      order: {
        weight: 'DESC',
      },
    });
    return {
      total,
      total_page,
      page,
      page_size,
      list,
    };
  }
}
