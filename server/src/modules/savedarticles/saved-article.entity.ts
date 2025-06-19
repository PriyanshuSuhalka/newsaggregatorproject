import { Entity, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { User } from '@modules/users/user.entity';
import { Article } from '@modules/articles/article.entity';

@Entity()
export class SavedArticle {
  @PrimaryGeneratedColumn()
  savedArticleID!: number;

  @ManyToOne(() => User, user => user.savedArticles)
  user!: User;

  @ManyToOne(() => Article)
  article!: Article;
}
