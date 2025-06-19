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
exports.ExternalApiService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const article_entity_1 = require("../articles/article.entity");
const category_entity_1 = require("../categories/category.entity");
const newsapi_adapter_1 = require("./adapters/newsapi.adapter");
let ExternalApiService = class ExternalApiService {
    constructor(articleRepo, categoryRepo) {
        this.articleRepo = articleRepo;
        this.categoryRepo = categoryRepo;
    }
    async fetchAndSaveArticles() {
        const provider = new newsapi_adapter_1.NewsApiAdapter();
        const articles = await provider.fetchArticles();
        for (const a of articles) {
            let category = await this.categoryRepo.findOneBy({ name: a.category });
            if (!category) {
                category = this.categoryRepo.create({ name: a.category });
                await this.categoryRepo.save(category);
            }
            const article = this.articleRepo.create({
                articleContent: a.title,
                source: a.source,
                URL: a.url,
                publishDate: a.publishedAt,
                category,
            });
            await this.articleRepo.save(article);
        }
    }
};
exports.ExternalApiService = ExternalApiService;
exports.ExternalApiService = ExternalApiService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(article_entity_1.Article)),
    __param(1, (0, typeorm_1.InjectRepository)(category_entity_1.Category)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], ExternalApiService);
