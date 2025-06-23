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
exports.ExternalApiCron = void 0;
// modules/externalapi/external-api.cron.ts
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const externalapi_service_1 = require("./externalapi.service");
let ExternalApiCron = class ExternalApiCron {
    constructor(externalApiService) {
        this.externalApiService = externalApiService;
    }
    handleCron() {
        console.log('[CRON] Fetching articles from external APIs...');
        this.externalApiService.fetchAndSaveArticles().catch((err) => {
            console.error('[CRON] Error during article fetch:', err.message);
        });
    }
};
exports.ExternalApiCron = ExternalApiCron;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_MINUTE),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ExternalApiCron.prototype, "handleCron", null);
exports.ExternalApiCron = ExternalApiCron = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [externalapi_service_1.ExternalApiService])
], ExternalApiCron);
