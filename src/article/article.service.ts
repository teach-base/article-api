import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Article } from 'src/entities/article.entity';
import { DataSource, In, Like, Repository, MoreThan } from 'typeorm';
import {
  CreateArticleDto,
  CreateArticleFolderDto,
  ListArticleQueryDto,
  SearchArticleQueryDto,
  UpdateArticleDto,
} from './article.dto';
import { Tag } from 'src/entities/tag.entity';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';

@Injectable()
export class ArticleService {
  constructor(
    @InjectRepository(Article)
    private readonly repository: Repository<Article>,

    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,

    private readonly dataSource: DataSource,
  ) {}

  async list(query: ListArticleQueryDto, uid: number) {
    const { pid, page = 1, page_size = 100 } = query;
    const where = typeof pid === 'number' ? { uid, pid } : undefined;
    const total = await this.repository.count();
    const total_page = Math.ceil(total / page_size);
    const list = await this.repository.find({
      where,
      take: page_size,
      skip: (page - 1) * page_size,
    });
    const tagIds = [...new Set(list.map((item) => item.tags).flat())];
    const tagEntities = tagIds.length
      ? await this.tagRepository.findBy({
          id: In(tagIds),
        })
      : [];

    const tagMap = new Map<number, string>();
    tagEntities.forEach((item) => {
      const { id, name } = item;
      tagMap.set(id, name);
    });

    return {
      pid,
      total,
      total_page,
      page,
      page_size,
      list: list.map((item) => {
        return {
          ...item,
          tags: item.tags.map((item) => ({
            id: item,
            name: tagMap.get(item),
          })),
        };
      }),
      tags: tagEntities,
    };
  }

  async search(query: SearchArticleQueryDto, uid: number) {
    const { page = 1, page_size = 100 } = query;
    const kw = decodeURIComponent(query.kw);
    const where = [
      {
        uid,
        title: Like(`%${kw}%`),
      },
      {
        uid,
        text: Like(`%${kw}%`),
      },
    ];
    const total = await this.repository.countBy(where);
    const total_page = Math.ceil(total / page_size);
    const list = await this.repository.find({
      where,
      take: page_size,
      skip: (page - 1) * page_size,
    });
    return {
      kw,
      total,
      total_page,
      page,
      page_size,
      list,
    };
  }

  async readArticle(id: number, uid: number) {
    const article = await this.repository.findOneBy({ uid, id });
    if (!article) {
      throw new NotFoundException(`找不到文章${id}`);
    }
    if (article.tags) {
      const tags = await this.tagRepository.findBy({
        id: In(article.tags),
      });
      return {
        ...article,
        tags: tags.map((item) => ({
          id: item.id,
          name: item.name,
        })),
      };
    }
    return article;
  }

  async createArticle(fields: CreateArticleDto, uid: number) {
    const { tags, text, title } = fields;
    if (tags.length) {
      await this.incrementOne(tags, uid);
    }
    const tagEntities = await this.tagRepository.findBy({
      uid,
      name: In(tags),
    });
    return await this.repository.save(
      this.repository.create({
        uid,
        title,
        text,
        is_folder: false,
        tags: tagEntities.map((item) => item.id),
      }),
    );
  }

  async createArticleFolder(fields: CreateArticleFolderDto, uid: number) {
    const { tags, title } = fields;
    if (tags.length) {
      await this.incrementOne(tags, uid);
    }
    const tagEntities = await this.tagRepository.findBy({ name: In(tags) });
    return await this.repository.save(
      this.repository.create({
        uid,
        title,
        is_folder: true,
        tags: tagEntities.map((item) => item.id),
      }),
    );
  }

  async updateItem(id: number, fields: UpdateArticleDto, uid: number) {
    const article = await this.repository.findOneBy({ uid, id });
    if (!article) {
      throw new NotFoundException(`文章[${id}]不存在`);
    }
    const { tags, text, title } = fields;
    if (tags) {
      await this.incrementOne(tags, uid);
      if (article.tags) {
        await this.decrementOne(article.tags, uid);
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
    return await this.repository.findOneBy({ id });
    // return await this.readArticle(id);
  }

  async removeItems(ids: number[], uid: number) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    const articles = await this.repository.findBy({
      uid,
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

        for (const [id, times] of releaseTags) {
          await this.tagRepository.decrement(
            {
              id,
            },
            'weight',
            times,
          );
        }
      });
      await queryRunner.commitTransaction();
      await queryRunner.release();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      throw err;
    }
  }

  private async incrementOne(tags: string[], uid: number) {
    if (!tags.length) {
      return;
    }
    const records = await this.tagRepository.findBy({
      uid,
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
        return this.tagRepository.create({ uid, name });
      });
      await this.tagRepository.save(entities);
    }
  }

  private async decrementOne(tagIds: number[], uid: number) {
    await this.tagRepository.decrement({ uid, id: In(tagIds) }, 'weight', 1);
    await this.tagRepository.delete({
      uid,
      id: In(tagIds),
      weight: 0,
    });
  }

  async moveArticles(tagIds: number[], pid: number, uid: number) {
    await this.repository.update(
      {
        uid,
        id: In(tagIds),
      },
      { pid },
    );
    return {};
  }

  async updateLike(id: number, like: number, uid: number) {
    const article = await this.repository.findOneBy({ id });
    if (article.uid !== uid) {
      throw new UnauthorizedException();
    }
    article.like = like;
    return await this.repository.save(article);
  }
  async listLike(paginationQuery: PaginationQueryDto, uid: number) {
    const where = { uid, like: MoreThan(0) };
    const { page, page_size } = paginationQuery;
    const list = await this.repository.findBy(where);
    const total = await this.repository.countBy(where);
    const total_page = Math.ceil(total / page_size);
    return {
      total,
      total_page,
      page,
      page_size,
      list,
    };
  }
}
