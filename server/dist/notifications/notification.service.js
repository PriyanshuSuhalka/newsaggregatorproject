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
exports.NotificationService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const notification_entity_1 = require("./notification.entity");
const notification_config_entity_1 = require("../notificationconfig/notification-config.entity");
const user_entity_1 = require("../users/user.entity");
let NotificationService = class NotificationService {
    constructor(notificationRepo, configRepo, userRepo) {
        this.notificationRepo = notificationRepo;
        this.configRepo = configRepo;
        this.userRepo = userRepo;
    }
    async notifyUsersForArticle(article) {
        const categoryName = article.category?.categoryName;
        if (!categoryName) {
            console.warn(`Category not found for article: ${article.articleTitle}`);
            return;
        }
        // Assuming `categories` in NotificationConfiguration is a comma-separated string like: "Politics,Technology"
        const configs = await this.configRepo.find({
            relations: ['user'],
            where: {
                categories: (0, typeorm_2.ILike)(`%${categoryName}%`), // Case-insensitive partial match
            },
        });
        if (configs.length === 0) {
            console.log(`No users configured for category: ${categoryName}`);
            return;
        }
        for (const config of configs) {
            const user = config.user;
            if (!user?.email)
                continue;
            const message = `📰 New article in "${categoryName}": ${article.articleTitle}`;
            const notification = this.notificationRepo.create({
                user,
                message,
            });
            await this.notificationRepo.save(notification);
            // TODO: Replace with actual email sender service later
            console.log(`🔔 Notification created for ${user.email} -> ${message}`);
        }
    }
};
exports.NotificationService = NotificationService;
exports.NotificationService = NotificationService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(notification_entity_1.Notification)),
    __param(1, (0, typeorm_1.InjectRepository)(notification_config_entity_1.NotificationConfiguration)),
    __param(2, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], NotificationService);
