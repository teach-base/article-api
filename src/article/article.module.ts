import { Module } from '@nestjs/common';
import { ArticleController } from './article.controller';
import { ArticleService } from './article.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Article } from 'src/entities/article.entity';
import { Tag } from 'src/entities/tag.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Article, Tag])],
  controllers: [ArticleController],
  providers: [ArticleService],
})
export class ArticleModule {}
