import { Entity, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { User } from '../users/user.entity';
import { Article } from '../articles/article.entity';

@Entity()
export class UserHistory {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => User, (user) => user.history)
  user!: User;

  @ManyToOne(() => Article, (article) => article.history)
  article!: Article;
}
