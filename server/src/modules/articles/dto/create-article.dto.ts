export class CreateArticleDto {
  articleTitle!: string;
  articleContent!: string;
  source!: string;
  URL!: string;
  publishDate!: Date;
  categoryId!: number;
  externalAPIId!: number;
}
