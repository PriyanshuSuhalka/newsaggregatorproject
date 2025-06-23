import { ExternalAPI } from '@modules/externalapi/external-api.entity';

export interface NormalizedArticle {
  title: string;       
  content: string;     
  url: string;
  source: string;
  category: string;
  publishedAt: Date;
  externalAPI?: ExternalAPI; 
}

export interface NewsProvider {
  fetchArticles(): Promise<NormalizedArticle[]>;
  fetchArticlesByCategory(category: string): Promise<NormalizedArticle[]>;
}
