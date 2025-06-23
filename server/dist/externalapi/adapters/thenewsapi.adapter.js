"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TheNewsApiAdapter = void 0;
const axios_1 = __importDefault(require("axios"));
const category_entity_1 = require("../../categories/category.entity");
const external_api_entity_1 = require("../external-api.entity");
class TheNewsApiAdapter {
    constructor(dataSource) {
        this.dataSource = dataSource;
    }
    async fetchArticles() {
        // Get API key for TheNewsAPI from the database
        const externalApiRepo = this.dataSource.getRepository(external_api_entity_1.ExternalAPI);
        const config = await externalApiRepo.findOne({
            where: { name: 'thenewsapi' },
        });
        if (!config) {
            throw new Error('TheNewsAPI config not found in ExternalAPI table');
        }
        const apiKey = config.key;
        const res = await axios_1.default.get('https://api.thenewsapi.com/v1/news/all', {
            params: {
                language: 'en',
                api_token: apiKey,
            },
        });
        // Fetch categories from DB
        const categoryRepo = this.dataSource.getRepository(category_entity_1.Category);
        const categories = await categoryRepo.find();
        const categoryNames = categories.map((c) => c.categoryName.toLowerCase());
        return res.data.data.map((article) => {
            const combinedText = `${article.title} ${article.content || ''}`.toLowerCase();
            const matchedCategory = categoryNames.find((cat) => combinedText.includes(cat)) || 'Unknown';
            return {
                title: article.title || "",
                content: article.content || "",
                url: article.url || "",
                source: article.source || "",
                category: matchedCategory,
                publishedAt: article.published ? new Date(article.published) : new Date(),
            };
        });
    }
}
exports.TheNewsApiAdapter = TheNewsApiAdapter;
