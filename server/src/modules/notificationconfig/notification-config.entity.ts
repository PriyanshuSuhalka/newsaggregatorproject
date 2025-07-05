import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToOne, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { Category } from '../categories/category.entity';
import { Keyword } from '../keywords/keyword.entity';

@Entity('notification_config')
export class NotificationConfiguration {
  @PrimaryGeneratedColumn()
  id!: number;

  @OneToOne(() => User, { nullable: false, eager: true })
  @JoinColumn({ name: 'user_id' })
  user!: User;


  @ManyToOne(() => Category, { eager: true })
  @JoinColumn({ name: 'category_id' })
  category!: Category;

  @ManyToOne(() => Keyword, { eager: true })
  @JoinColumn({ name: 'keyword_id' })
  keyword!: Keyword;
}