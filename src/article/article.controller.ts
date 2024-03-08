import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ArticleService } from './article.service';
import {
  CreateArticleDto,
  CreateArticleFolderDto,
  LikeArticleDto,
  // LikeArticleDto,
  ListArticleQueryDto,
  MoveArticleDto,
  SearchArticleQueryDto,
  UpdateArticleDto,
} from './article.dto';
import { Uid } from 'src/account/decorators/uid.decorator';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
// import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';

@Controller('article')
export class ArticleController {
  constructor(private readonly service: ArticleService) {}

  @Post()
  async createArticle(@Body() fields: CreateArticleDto, @Uid() uid: number) {
    return await this.service.createArticle(fields, uid);
  }

  @Post('folder')
  async createArticleFolder(
    @Body() fields: CreateArticleFolderDto,
    @Uid() uid: number,
  ) {
    return await this.service.createArticleFolder(fields, uid);
  }

  @Get()
  async listArticle(@Query() query: ListArticleQueryDto, @Uid() uid: number) {
    return await this.service.list(query, uid);
  }

  @Get('like')
  async listLike(
    @Query() paginationQuery: PaginationQueryDto,
    @Uid() uid: number,
  ) {
    return await this.service.listLike(paginationQuery, uid);
  }

  @Get('search')
  async searchArticle(
    @Query() query: SearchArticleQueryDto,
    @Uid() uid: number,
  ) {
    return await this.service.search(query, uid);
  }

  @Get(':id')
  async readArticle(@Param('id') id: number, @Uid() uid: number) {
    return await this.service.readArticle(id, uid);
  }

  @Patch(':id')
  async updateArticle(
    @Param('id') id: number,
    @Body() fields: UpdateArticleDto,
    @Uid() uid: number,
  ) {
    return await this.service.updateItem(id, fields, uid);
  }

  @Delete(':id')
  async removeArticle(@Param('id') id: number, @Uid() uid: number) {
    return await this.service.removeItems([id], uid);
  }

  @Post('move')
  async moveArticle(@Body() fields: MoveArticleDto, @Uid() uid: number) {
    return await this.service.moveArticles(fields.ids, fields.pid, uid);
  }

  @Post('like')
  async updateLike(@Body() fields: LikeArticleDto, @Uid() uid: number) {
    return await this.service.updateLike(fields.id, fields.change, uid);
  }
}
