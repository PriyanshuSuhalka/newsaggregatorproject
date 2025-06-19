"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewsApiAdapter = void 0;
const axios_1 = __importDefault(require("axios"));
class NewsApiAdapter {
    constructor() {
        this.apiKey = 'eef5fad257c34f5bbbe9b344de9c2c41';
    }
    async fetchArticles() {
        const res = await axios_1.default.get(`https://newsapi.org/v2/top-headlines?country=us&apiKey=${this.apiKey}`);
        return res.data.articles.map((article) => ({
            title: article.title,
            url: article.url,
            source: article.source.name,
            category: 'General', // Default category
            publishedAt: new Date(article.publishedAt),
        }));
    }
}
exports.NewsApiAdapter = NewsApiAdapter;
