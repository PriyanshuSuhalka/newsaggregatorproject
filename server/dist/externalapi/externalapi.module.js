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
var ExternalApiService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExternalApiService = void 0;
// externalapi.service.ts
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const article_entity_1 = require("../articles/article.entity");
const category_entity_1 = require("../categories/category.entity");
const newsapi_adapter_1 = require("./adapters/newsapi.adapter");
let ExternalApiService = ExternalApiService_1 = class ExternalApiService {
    constructor(articleRepo, categoryRepo) {
        this.articleRepo = articleRepo;
        this.categoryRepo = categoryRepo;
        this.logger = new common_1.Logger(ExternalApiService_1.name);
    }
    async fetchAndSaveFromNewsApi() {
        const adapter = new newsapi_adapter_1.NewsApiAdapter();
        const articles = await adapter.fetchArticles();
        for (const a of articles) {
            // Fallback to 'Unknown' if category not found
            const category = await this.saveOrFindCategory(a.category);
            const article = this.articleRepo.create({
                articleContent: a.title,
                source: a.source,
                URL: a.url,
                publishDate: new Date(a.publishedAt),
                category,
            });
            await this.articleRepo.save(article);
            this.logger.log(`✅ Article saved: ${a.title}`);
        }
    }
    async saveOrFindCategory(name) {
        // Try finding existing category
        const existing = await this.categoryRepo.findOne({ where: { categoryName: name } });
        if (existing)
            return existing;
        // Use or create 'Unknown' category
        let unknown = await this.categoryRepo.findOne({ where: { categoryName: 'Unknown' } });
        if (!unknown) {
            unknown = this.categoryRepo.create({ categoryName: 'Unknown' });
            unknown = await this.categoryRepo.save(unknown);
            this.logger.warn(`Fallback category 'Unknown' created.`);
        }
        this.logger.warn(`Category '${name}' not found. Using 'Unknown'.`);
        return unknown;
    }
};
exports.ExternalApiService = ExternalApiService;
exports.ExternalApiService = ExternalApiService = ExternalApiService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(article_entity_1.Article)),
    __param(1, (0, typeorm_1.InjectRepository)(category_entity_1.Category)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], ExternalApiService);
