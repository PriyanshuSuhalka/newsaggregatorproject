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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../users/user.entity");
let AuthService = class AuthService {
    constructor(userRepo) {
        this.userRepo = userRepo;
        this.loggedInUsers = new Map();
    }
    async signup(data) {
        const exists = await this.userRepo.findOne({
            where: { email: data.email },
        });
        if (exists)
            throw new common_1.BadRequestException("User already exists");
        const user = this.userRepo.create({ ...data, role: "user" });
        await this.userRepo.save(user);
        return { message: "Signup successful" };
    }
    async login(dto) {
        const user = await this.userRepo.findOne({
            where: { email: dto.email },
        });
        if (!user || user.password !== dto.password) {
            throw new common_1.BadRequestException("Invalid credentials");
        }
        this.loggedInUsers.set(user.email, true); // ✅ FIXED: use .set instead of .add
        return {
            message: "Login successful",
            role: user.role,
        };
    }
    logout(email) {
        if (this.loggedInUsers.get(email)) {
            this.loggedInUsers.delete(email);
            return { message: "Logout successful" };
        }
        else {
            throw new common_1.BadRequestException("User not logged in");
        }
    }
    isLoggedIn(email) {
        return this.loggedInUsers.get(email) || false;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], AuthService);
