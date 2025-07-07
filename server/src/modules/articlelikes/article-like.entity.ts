import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, Unique } from 'typeorm';
import { User } from '../users/user.entity';
import { Article } from '../articles/article.entity';

export enum LikeType {
  LIKE = 'LIKE',
  DISLIKE = 'DISLIKE'
}

@Entity('article_likes')
@Unique(['user', 'article']) // One vote per user per article
export class ArticleLike {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => User, { eager: true })
  user!: User;

  @ManyToOne(() => Article, { eager: true })
  article!: Article;

  @Column({
    type: 'enum',
    enum: LikeType,
  })
  likeType!: LikeType;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
