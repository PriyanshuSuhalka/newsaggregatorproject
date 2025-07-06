import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Between, ILike } from "typeorm";
import { Article } from "./article.entity";
import { CreateArticleDto } from "./dto/create-article.dto";
import { Category } from "@modules/categories/category.entity";
import { ExternalAPI } from "@modules/externalapi/external-api.entity";
import { User } from "@modules/users/user.entity";

export interface SearchOptions {
  keyword: string;
  start?: string;
  end?: string;
}

@Injectable()
export class ArticleService {
  constructor(
    @InjectRepository(Article)
    private articleRepo: Repository<Article>,

    @InjectRepository(Category)
    private categoryRepo: Repository<Category>,

    @InjectRepository(ExternalAPI)
    private externalRepo: Repository<ExternalAPI>,

    @InjectRepository(User)
    private userRepo: Repository<User>
  ) {}

  findAll() {
    return this.articleRepo.find({
      where: { 
        isHidden: false,
        category: { isHidden: false }
      }
    });
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
    const where: any = {
      isHidden: false,
      category: { isHidden: false }
    };

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
        { 
          articleTitle: ILike(`%${keyword}%`),
          isHidden: false,
          category: { isHidden: false }
        },
        { 
          articleContent: ILike(`%${keyword}%`),
          isHidden: false,
          category: { isHidden: false }
        },
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

    // Apply content filtering
    this.applyContentFilter(query);

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

  /**
   * Enhanced search with date range filtering, sorted by date
   */
  async searchArticles(options: SearchOptions): Promise<Article[]> {
    const { keyword, start, end } = options;

    const query = this.articleRepo
      .createQueryBuilder("article")
      .leftJoinAndSelect("article.category", "category")
      .leftJoinAndSelect("article.externalAPI", "externalAPI");

    // Apply content filtering
    this.applyContentFilter(query);

    // Add keyword search conditions (title and content)
    query.andWhere(
      "(LOWER(article.articleTitle) LIKE LOWER(:keyword) OR LOWER(article.articleContent) LIKE LOWER(:keyword))",
      { keyword: `%${keyword}%` }
    );

    // Add date range filter if provided
    if (start && end) {
      query.andWhere("article.publishDate BETWEEN :start AND :end", {
        start: new Date(start),
        end: new Date(end),
      });
    }

    // Always sort by date (newest first)
    query.orderBy("article.publishDate", "DESC");

    return await query.getMany();
  }

  /**
   * Get search suggestions based on partial keyword
   */
  async getSearchSuggestions(partialKeyword: string): Promise<string[]> {
    if (!partialKeyword || partialKeyword.length < 2) {
      return [];
    }

    const results = await this.articleRepo
      .createQueryBuilder("article")
      .select("DISTINCT article.articleTitle")
      .where("LOWER(article.articleTitle) LIKE LOWER(:keyword)", {
        keyword: `%${partialKeyword}%`,
      })
      .limit(10)
      .getRawMany();

    return results.map((r) => r.article_articleTitle);
  }

  // Add content filtering to existing methods
  private applyContentFilter(query: any) {
    // Filter out hidden articles
    query.andWhere("article.isHidden = :isHidden", { isHidden: false });

    // Filter out articles from hidden categories
    query.andWhere("category.isHidden = :categoryHidden", { categoryHidden: false });

    return query;
  }

  // Admin methods for hiding/unhiding articles
  async hideArticle(articleId: number, adminId: number): Promise<void> {
    const admin = await this.userRepo.findOne({ where: { userID: adminId } });

    if (!admin || admin.role !== 'admin') {
      throw new Error('Only admins can hide articles');
    }

    await this.articleRepo.update(articleId, {
      isHidden: true,
      hiddenBy: admin,
      hiddenAt: new Date(),
    });
  }

  async unhideArticle(articleId: number, adminId: number): Promise<void> {
    const admin = await this.userRepo.findOne({ where: { userID: adminId } });

    if (!admin || admin.role !== 'admin') {
      throw new Error('Only admins can unhide articles');
    }

    await this.articleRepo.update(articleId, {
      isHidden: false,
      hiddenBy: undefined,
      hiddenAt: undefined,
    });
  }
}
