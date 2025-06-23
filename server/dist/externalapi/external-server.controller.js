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
exports.ExternalServerController = void 0;
const common_1 = require("@nestjs/common");
const externalserver_service_1 = require("./externalserver.service");
const external_api_entity_1 = require("./external-api.entity");
const class_transformer_1 = require("class-transformer");
let ExternalServerController = class ExternalServerController {
    constructor(externalServerService) {
        this.externalServerService = externalServerService;
    }
    async getAllServers() {
        const servers = await this.externalServerService.findAll();
        return (0, class_transformer_1.plainToInstance)(external_api_entity_1.ExternalAPI, servers, { exposeUnsetFields: false });
    }
    getServerById(id) {
        return this.externalServerService.findOne(id);
    }
    updateApiKey(id, key) {
        return this.externalServerService.updateApiKey(id, key);
    }
};
exports.ExternalServerController = ExternalServerController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ExternalServerController.prototype, "getAllServers", null);
__decorate([
    (0, common_1.Get)(":id"),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], ExternalServerController.prototype, "getServerById", null);
__decorate([
    (0, common_1.Put)(":id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)("key")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String]),
    __metadata("design:returntype", void 0)
], ExternalServerController.prototype, "updateApiKey", null);
exports.ExternalServerController = ExternalServerController = __decorate([
    (0, common_1.Controller)("external-servers"),
    __metadata("design:paramtypes", [externalserver_service_1.ExternalServerService])
], ExternalServerController);
