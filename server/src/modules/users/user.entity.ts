import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { SavedArticle } from '@modules/savedarticles/saved-article.entity';
import { Notification } from '@modules/notifications/notification.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  userID!: number;

  @Column({ default: 'user' })
  role!: 'user' | 'admin';

  @Column()
  password!: string;

  @Column()
  name!: string;

  @Column({ unique: true })
  email!: string;

  // Bookmarked/saved articles via join table
  @OneToMany(() => SavedArticle, (sa) => sa.user, { cascade: true })
  savedArticles!: SavedArticle[];

  // Notifications linked to user
  @OneToMany(() => Notification, (n) => n.user, { cascade: true })
  notifications!: Notification[];
}
