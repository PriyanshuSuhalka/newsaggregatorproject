import axios from 'axios';
import { NewsProvider, NormalizedArticle } from '../interfaces/news-provider.interface';

export class NewsApiAdapter implements NewsProvider {
  private readonly apiKey = 'eef5fad257c34f5bbbe9b344de9c2c41';

  async fetchArticles(): Promise<NormalizedArticle[]> {
    const res = await axios.get(
      `https://newsapi.org/v2/top-headlines?country=us&apiKey=${this.apiKey}`
    );

    return res.data.articles.map((article: any) => ({
      title: article.title,
      url: article.url,
      source: article.source.name,
      category: 'General', // Default category
      publishedAt: new Date(article.publishedAt),
    }));
  }
}
