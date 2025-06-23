"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const config_1 = require("@nestjs/config");
const schedule_1 = require("@nestjs/schedule");
const externalapi_module_1 = require("./externalapi/externalapi.module");
const user_entity_1 = require("./users/user.entity");
const category_entity_1 = require("./categories/category.entity");
const auth_module_1 = require("./auth/auth.module");
const external_api_entity_1 = require("./externalapi/external-api.entity");
const article_entity_1 = require("./articles/article.entity");
const saved_article_entity_1 = require("./savedarticles/saved-article.entity");
const notification_entity_1 = require("./notifications/notification.entity");
const external_server_controller_1 = require("./externalapi/external-server.controller");
const category_controller_1 = require("./categories/category.controller");
const category_service_1 = require("./categories/category.service");
const externalserver_service_1 = require("./externalapi/externalserver.service");
const user_module_1 = require("./users/user.module");
const article_service_1 = require("./articles/article.service");
const article_controller_1 = require("./articles/article.controller");
const saved_article_module_1 = require("./savedarticles/saved-article.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            // Load .env variables globally
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            // Database Connection
            typeorm_1.TypeOrmModule.forRoot({
                type: "mysql",
                host: process.env.DB_HOST,
                port: parseInt(process.env.DB_PORT || "3306"),
                username: process.env.DB_USERNAME,
                password: process.env.DB_PASSWORD,
                database: process.env.DB_NAME,
                synchronize: true,
                entities: [
                    user_entity_1.User,
                    article_entity_1.Article,
                    category_entity_1.Category,
                    saved_article_entity_1.SavedArticle,
                    notification_entity_1.Notification,
                    external_api_entity_1.ExternalAPI,
                ],
            }),
            // Register repositories for DI
            typeorm_1.TypeOrmModule.forFeature([
                user_entity_1.User,
                article_entity_1.Article,
                category_entity_1.Category,
                saved_article_entity_1.SavedArticle,
                notification_entity_1.Notification,
                external_api_entity_1.ExternalAPI,
            ]),
            auth_module_1.AuthModule,
            schedule_1.ScheduleModule.forRoot(),
            externalapi_module_1.ExternalApiModule,
            saved_article_module_1.SavedArticleModule,
            user_module_1.UserModule,
        ],
        controllers: [article_controller_1.ArticleController, external_server_controller_1.ExternalServerController, category_controller_1.CategoryController],
        providers: [article_service_1.ArticleService, externalserver_service_1.ExternalServerService, category_service_1.CategoryService],
    })
], AppModule);
