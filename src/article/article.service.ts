import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Article } from 'src/entities/article.entity';
import { DataSource, In, Repository } from 'typeorm';
import {
  CreateArticleDto,
  CreateArticleFolderDto,
  ListArticleQueryDto,
  UpdateArticleDto,
} from './article.dto';
import { Tag } from 'src/entities/tag.entity';

@Injectable()
export class ArticleService {
  constructor(
    @InjectRepository(Article)
    private readonly repository: Repository<Article>,

    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,

    private readonly dataSource: DataSource,
  ) {}

  async list(query: ListArticleQueryDto) {
    const { pid, page = 1, page_size = 100 } = query;
    const where = typeof pid === 'number' ? { pid } : undefined;
    const total = await this.repository.count();
    const total_page = Math.ceil(total / page_size);
    const list = await this.repository.find({
      where,
      take: page_size,
      skip: (page - 1) * page_size,
    });
    return {
      total,
      total_page,
      page,
      page_size,
      list,
    };
  }

  async readArticle(id: number) {
    const article = await this.repository.findOneBy({ id });
    if (!article) {
      throw new NotFoundException(`找不到文章${id}`);
    }
    if (article.tags) {
      const tags = await this.tagRepository.findBy({ id: In(article.tags) });
      return {
        ...article,
        tags: tags.map((item) => item.name),
      };
    }
    return article;
  }

  async createArticle(fields: CreateArticleDto) {
    const { tags, text, title } = fields;
    if (tags.length) {
      await this.incrementOne(tags);
    }
    const tagEntities = await this.tagRepository.findBy({ name: In(tags) });
    return await this.repository.save(
      this.repository.create({
        title,
        text,
        is_folder: false,
        tags: tagEntities.map((item) => item.id),
      }),
    );
  }

  async createArticleFolder(fields: CreateArticleFolderDto) {
    const { tags, title } = fields;
    if (tags.length) {
      await this.incrementOne(tags);
    }
    const tagEntities = await this.tagRepository.findBy({ name: In(tags) });
    return await this.repository.save(
      this.repository.create({
        title,
        is_folder: true,
        tags: tagEntities.map((item) => item.id),
      }),
    );
  }

  async updateItem(id: number, fields: UpdateArticleDto) {
    const article = await this.repository.findOneBy({ id });
    if (!article) {
      throw new NotFoundException(`文章[${id}]不存在`);
    }
    const { tags, text, title } = fields;
    if (tags) {
      await this.incrementOne(tags);
      if (article.tags) {
        await this.decrementOne(article.tags);
      }
      const tagEntities = await this.tagRepository.findBy({ name: In(tags) });
      await this.repository.update(id, {
        title,
        text,
        tags: tagEntities.map((item) => item.id),
      });
    } else {
      await this.repository.update(id, {
        title,
        text,
      });
    }
    return await this.readArticle(id);
  }

  async removeItems(ids: number[]) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    const articles = await this.repository.findBy({
      id: In(ids),
    });
    if (!articles.length) {
      return;
    }
    const releaseTags = new Map<number, number>();
    const cacheTag = (tagId: number) => {
      if (releaseTags.get(tagId)) {
        releaseTags.set(tagId, releaseTags.get(tagId) + 1);
      } else {
        releaseTags.set(tagId, 1);
      }
    };
    const cacheTags = (tags: number[]) => {
      for (const tag of tags) {
        cacheTag(tag);
      }
    };

    try {
      await this.dataSource.transaction(async (manager) => {
        const removeArticles = async (articles: Article[]) => {
          for (const article of articles.values()) {
            const { id, tags, is_folder } = article;
            cacheTags(tags);
            if (is_folder) {
              const children = await manager.findBy(Article, { pid: id });
              if (children.length) {
                await removeArticles(children);
              }
            }
          }
          await manager.remove(articles);
        };

        await removeArticles(articles);
      });
      await queryRunner.commitTransaction();
      await queryRunner.release();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      throw err;
    }
  }

  private async incrementOne(tags: string[]) {
    if (!tags.length) {
      return;
    }
    const records = await this.tagRepository.findBy({
      name: In(tags),
    });
    const existTagNameList = records.map((tag) => tag.name);
    const unexistTagNameList = tags.filter(
      (name) => !existTagNameList.includes(name),
    );
    if (existTagNameList.length) {
      await this.tagRepository.increment(
        { name: In(existTagNameList) },
        'weight',
        1,
      );
    }
    if (unexistTagNameList.length) {
      const entities = unexistTagNameList.map((name) => {
        return this.tagRepository.create({ name });
      });
      await this.tagRepository.save(entities);
    }
  }

  private async decrementOne(tagIds: number[]) {
    await this.tagRepository.decrement({ id: In(tagIds) }, 'weight', 1);
  }
}
