"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationModule = void 0;
const common_1 = require("@nestjs/common");
const notification_service_1 = require("./notification.service");
const externalapi_service_1 = require("../externalapi/externalapi.service");
const newsapi_adapter_1 = require("../externalapi/adapters/newsapi.adapter");
const thenewsapi_adapter_1 = require("../externalapi/adapters/thenewsapi.adapter");
const externalapi_module_1 = require("../externalapi/externalapi.module");
let NotificationModule = class NotificationModule {
};
exports.NotificationModule = NotificationModule;
exports.NotificationModule = NotificationModule = __decorate([
    (0, common_1.Module)({
        imports: [externalapi_module_1.ExternalApiModule],
        providers: [
            notification_service_1.NotificationService,
            externalapi_service_1.ExternalApiService,
            newsapi_adapter_1.NewsApiAdapter,
            thenewsapi_adapter_1.TheNewsApiAdapter,
        ],
        exports: [notification_service_1.NotificationService],
    })
], NotificationModule);
