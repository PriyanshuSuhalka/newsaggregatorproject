import axios from 'axios';
import { DataSource } from 'typeorm';
import { Category } from '@modules/categories/category.entity';
import { ExternalAPI } from '@modules/externalapi/external-api.entity';
import { NormalizedArticle } from '../interfaces/news-provider.interface';

export class TheNewsApiAdapter {
  constructor(private readonly dataSource: DataSource) {}

  async fetchArticles(): Promise<NormalizedArticle[]> {
    // Get API key for TheNewsAPI from the database
    const externalApiRepo = this.dataSource.getRepository(ExternalAPI);
    const config = await externalApiRepo.findOne({
      where: { name: 'thenewsapi' },
    });

    if (!config) {
      throw new Error('TheNewsAPI config not found in ExternalAPI table');
    }

    const apiKey = config.key;

    const res = await axios.get('https://api.thenewsapi.com/v1/news/all', {
      params: {
        language: 'en',
        api_token: apiKey,
      },
    });

    // Fetch categories from DB
    const categoryRepo = this.dataSource.getRepository(Category);
    const categories = await categoryRepo.find();
    const categoryNames = categories.map((c) => c.categoryName.toLowerCase());

    return res.data.data.map((article: any) => {
      // TheNewsApi doesn't provide full content, use description + snippet
      const content = `${article.description || ''} ${article.snippet || ''}`.trim();
      const combinedText = `${article.title} ${content}`.toLowerCase();
      
      // Try to match against TheNewsApi's own categories first, then fall back to keyword matching
      let matchedCategory = 'General';
      if (article.categories && article.categories.length > 0) {
        const apiCategory = article.categories[0].toLowerCase();
        matchedCategory = categoryNames.find((cat) => cat === apiCategory) || 
                          categoryNames.find((cat) => combinedText.includes(cat)) || 
                          'General';
      } else {
        matchedCategory = categoryNames.find((cat) => combinedText.includes(cat)) || 'General';
      }

      return {
        title: article.title || "",
        content: content,
        url: article.url || "",
        source: article.source || "",
        category: matchedCategory,
        publishedAt: article.published_at ? new Date(article.published_at) : new Date(),
      };
    });
  }
}
