export interface NewsProvider {
  fetchArticles(): Promise<NormalizedArticle[]>;
}

export interface NormalizedArticle {
  title: string;
  url: string;
  source: string;
  category: string;
  publishedAt: Date;
}
