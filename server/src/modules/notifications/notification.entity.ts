import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from '@modules/users/user.entity';

@Entity()
export class Notification {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 255 })
  message!: string;

  @Column({ default: false })
  isRead!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @Column({ nullable: true })
  articleId?: number;

  @ManyToOne(() => User, user => user.notifications)
  user!: User;
}
