import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { SavedArticle } from '@modules/savedarticles/saved-article.entity';
import { Notification } from '@modules/notifications/notification.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn() userID!: number;
  @Column({ default: 'user' }) 
  role!: 'user' | 'admin';
  @Column() password!: string;
  @Column() name!: string;
  @Column() email!: string;

  @OneToMany(() => SavedArticle, sa => sa.user) savedArticles!: SavedArticle[];
  @OneToMany(() => Notification, n => n.user) notifications!: Notification[];
}