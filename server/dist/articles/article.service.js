"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArticleService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const article_entity_1 = require("./article.entity");
const category_entity_1 = require("../categories/category.entity");
const external_api_entity_1 = require("../externalapi/external-api.entity");
const typeorm_3 = require("typeorm");
let ArticleService = class ArticleService {
    constructor(articleRepo, categoryRepo, externalRepo) {
        this.articleRepo = articleRepo;
        this.categoryRepo = categoryRepo;
        this.externalRepo = externalRepo;
    }
    findAll() {
        return this.articleRepo.find();
    }
    async create(dto) {
        const category = await this.categoryRepo.findOneBy({
            categoryID: dto.categoryId,
        });
        if (!category)
            throw new Error("Category not found");
        const api = await this.externalRepo.findOneBy({
            externalAPIID: dto.externalAPIId,
        });
        if (!api)
            throw new Error("External API not found");
        const article = new article_entity_1.Article();
        article.articleContent = dto.articleContent;
        article.source = dto.source;
        article.URL = dto.URL;
        article.publishDate = dto.publishDate;
        article.category = category;
        article.externalAPI = api;
        return this.articleRepo.save(article);
    }
    async getArticlesByDateRange(start, end) {
        const where = {};
        if (start && end) {
            where.publishDate = (0, typeorm_2.Between)(new Date(start), new Date(end));
        }
        return this.articleRepo.find({
            where,
            order: { publishDate: "DESC" },
        });
    }
    async searchByKeyword(keyword) {
        return this.articleRepo.find({
            where: [
                { articleTitle: (0, typeorm_3.ILike)(`%${keyword}%`) },
                { articleContent: (0, typeorm_3.ILike)(`%${keyword}%`) },
            ],
            order: { publishDate: "DESC" },
        });
    }
    async getArticles(start, end, category) {
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
};
exports.ArticleService = ArticleService;
exports.ArticleService = ArticleService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(article_entity_1.Article)),
    __param(1, (0, typeorm_1.InjectRepository)(category_entity_1.Category)),
    __param(2, (0, typeorm_1.InjectRepository)(external_api_entity_1.ExternalAPI)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], ArticleService);
