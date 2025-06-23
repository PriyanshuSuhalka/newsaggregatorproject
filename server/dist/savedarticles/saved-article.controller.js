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
exports.SavedArticleController = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const saved_article_entity_1 = require("./saved-article.entity");
const article_entity_1 = require("../articles/article.entity");
const user_entity_1 = require("../users/user.entity");
const create_saved_article_dto_1 = require("./dto/create-saved-article.dto");
let SavedArticleController = class SavedArticleController {
    constructor(savedRepo, userRepo, articleRepo) {
        this.savedRepo = savedRepo;
        this.userRepo = userRepo;
        this.articleRepo = articleRepo;
    }
    async saveArticle(dto) {
        const user = await this.userRepo.findOne({
            where: { userID: dto.userId },
        });
        const article = await this.articleRepo.findOne({
            where: { articleID: dto.articleId },
        });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        if (!article)
            throw new common_1.NotFoundException('Article not found');
        const alreadySaved = await this.savedRepo.findOne({
            where: {
                user: { userID: user.userID },
                article: { articleID: article.articleID },
            },
        });
        if (alreadySaved) {
            return { message: 'Article already bookmarked' };
        }
        const saved = this.savedRepo.create({ user, article });
        await this.savedRepo.save(saved);
        return { message: 'Article bookmarked successfully' };
    }
    async getSavedArticles(userId) {
        const user = await this.userRepo.findOne({ where: { userID: userId } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        const savedArticles = await this.savedRepo.find({
            where: { user: { userID: user.userID } },
            relations: ['article'],
        });
        return savedArticles;
    }
};
exports.SavedArticleController = SavedArticleController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_saved_article_dto_1.CreateSavedArticleDto]),
    __metadata("design:returntype", Promise)
], SavedArticleController.prototype, "saveArticle", null);
__decorate([
    (0, common_1.Get)(':userId'),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], SavedArticleController.prototype, "getSavedArticles", null);
exports.SavedArticleController = SavedArticleController = __decorate([
    (0, common_1.Controller)('saved-articles'),
    __param(0, (0, typeorm_1.InjectRepository)(saved_article_entity_1.SavedArticle)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(2, (0, typeorm_1.InjectRepository)(article_entity_1.Article)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], SavedArticleController);
