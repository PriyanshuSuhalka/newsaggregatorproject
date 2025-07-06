import { Entity, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, Unique } from 'typeorm';
import { User } from '../users/user.entity';
import { Article } from '../articles/article.entity';

@Entity('article_reports')
@Unique(['user', 'article']) // One report per user per article
export class ArticleReport {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => User, { eager: true })
  user!: User;

  @ManyToOne(() => Article, { eager: true })
  article!: Article;

  @CreateDateColumn()
  createdAt!: Date;
}
