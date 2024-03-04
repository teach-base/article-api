import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ArticleModule } from './article/article.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { resolve } from 'path';
import { TagModule } from './tag/tag.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: resolve(__dirname, '../db/app.sqlite'),
      autoLoadEntities: true,
      // entities: [Article],
      synchronize: true,
    }),
    ArticleModule,
    TagModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
