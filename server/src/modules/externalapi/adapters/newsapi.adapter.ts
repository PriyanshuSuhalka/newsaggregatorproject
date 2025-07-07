import axios from 'axios';
import { DataSource } from 'typeorm';
import { Category } from '@modules/categories/category.entity';
import { ExternalAPI } from '@modules/externalapi/external-api.entity';
import { NormalizedArticle } from '../interfaces/news-provider.interface';

export class NewsApiAdapter {
  constructor(private readonly dataSource: DataSource) {}

  async fetchArticles(): Promise<NormalizedArticle[]> {
    // Fetch the API key dynamically from the database
    const externalApiRepo = this.dataSource.getRepository(ExternalAPI);
    const newsApi = await externalApiRepo.findOne({
      where: { name: 'newsapi' },
    });

    if (!newsApi) {
      throw new Error('NewsAPI config not found in ExternalAPI table');
    }

    const apiKey = newsApi.key;

    const res = await axios.get(
      `https://newsapi.org/v2/top-headlines?country=us&apiKey=${apiKey}`
    );

    // Fetch categories from DB
    const categoryRepo = this.dataSource.getRepository(Category);
    const categories = await categoryRepo.find();
    const categoryNames = categories.map((c) => c.categoryName.toLowerCase());

    return res.data.articles.map((article: any) => {
      const combinedText = `${article.title} ${article.content || ''}`.toLowerCase();
      const matchedCategory =
        categoryNames.find((cat) => combinedText.includes(cat)) || 'General';

      return {
        title: article.title || '',
        content: article.content || '',
        url: article.url || '',
        source: article.source?.name || '',
        category: matchedCategory,
        publishedAt: article.publishedAt ? new Date(article.publishedAt) : new Date(),
      };
    });
  }
}
