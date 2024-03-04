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
  ListArticleQueryDto,
  UpdateArticleDto,
} from './article.dto';

@Controller('article')
export class ArticleController {
  constructor(private readonly service: ArticleService) {}

  @Post()
  async createArticle(@Body() fields: CreateArticleDto) {
    return await this.service.createArticle(fields);
  }

  @Post('folder')
  async createArticleFolder(@Body() fields: CreateArticleFolderDto) {
    return await this.service.createArticleFolder(fields);
  }

  @Get()
  async listArticle(@Query() query: ListArticleQueryDto) {
    return await this.service.list(query);
  }

  @Get(':id')
  async readArticle(@Param('id') id: number) {
    return await this.service.readArticle(id);
  }

  @Patch(':id')
  async updateArticle(
    @Param('id') id: number,
    @Body() fields: UpdateArticleDto,
  ) {
    return await this.service.updateItem(id, fields);
  }

  @Delete(':id')
  async removeArticle(@Param('id') id: number) {
    return await this.service.removeItems([id]);
  }
}
