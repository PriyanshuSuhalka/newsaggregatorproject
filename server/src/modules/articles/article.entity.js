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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Article = void 0;
const typeorm_1 = require("typeorm");
const category_entity_1 = require("../categories/category.entity");
const external_api_entity_1 = require("../externalapi/external-api.entity");
let Article = class Article {
};
exports.Article = Article;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Article.prototype, "articleID", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Article.prototype, "articleContent", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Article.prototype, "source", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Article.prototype, "URL", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Date)
], Article.prototype, "publishDate", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => category_entity_1.Category, { eager: true }),
    __metadata("design:type", category_entity_1.Category)
], Article.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => external_api_entity_1.ExternalAPI, { eager: true }),
    __metadata("design:type", external_api_entity_1.ExternalAPI)
], Article.prototype, "externalAPI", void 0);
exports.Article = Article = __decorate([
    (0, typeorm_1.Entity)()
], Article);
