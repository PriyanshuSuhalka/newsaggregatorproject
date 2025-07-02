import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Between } from "typeorm";
import { Article } from "./article.entity";
import { CreateArticleDto } from "./dto/create-article.dto";
import { Category } from "@modules/categories/category.entity";
import { ExternalAPI } from "@modules/externalapi/external-api.entity";
import { ILike } from "typeorm";

@Injectable()
export class ArticleService {
  constructor(
    @InjectRepository(Article)
    private articleRepo: Repository<Article>,

    @InjectRepository(Category)
    private categoryRepo: Repository<Category>,

    @InjectRepository(ExternalAPI)
    private externalRepo: Repository<ExternalAPI>
  ) {}

  findAll() {
    return this.articleRepo.find();
  }

  async create(dto: CreateArticleDto) {
    const category = await this.categoryRepo.findOneBy({
      categoryID: dto.categoryId,
    });
    if (!category) throw new Error("Category not found");

    const api = await this.externalRepo.findOneBy({
      externalAPIID: dto.externalAPIId,
    });
    if (!api) throw new Error("External API not found");

    const article = new Article();
    article.articleTitle = dto.articleTitle;
    article.articleContent = dto.articleContent;
    article.source = dto.source;
    article.URL = dto.URL;
    article.publishDate = dto.publishDate;
    article.category = category;
    article.externalAPI = api;

    return this.articleRepo.save(article);
  }

  async getArticlesByDateRange(start?: string, end?: string) {
    const where: any = {};

    if (start && end) {
      where.publishDate = Between(new Date(start), new Date(end));
    }

    return this.articleRepo.find({
      where,
      order: { publishDate: "DESC" },
    });
  }
  async searchByKeyword(keyword: string): Promise<Article[]> {
    return this.articleRepo.find({
      where: [
        { articleTitle: ILike(`%${keyword}%`) },
        { articleContent: ILike(`%${keyword}%`) },
      ],
      order: { publishDate: "DESC" },
    });
  }
  async getArticles(
    start?: string,
    end?: string,
    category?: string
  ): Promise<Article[]> {
    const query = this.articleRepo
      .createQueryBuilder("article")
      .leftJoinAndSelect("article.category", "category");

    if (start && end) {
      query.andWhere("article.publishDate BETWEEN :start AND :end", {
        start,
        end,
      });
    }

    if (category && category !== "All") {
      query.andWhere("LOWER(category.categoryName) = LOWER(:category)", {
        category,
      });
    }

    return await query.orderBy("article.publishDate", "DESC").getMany();
  }
}
