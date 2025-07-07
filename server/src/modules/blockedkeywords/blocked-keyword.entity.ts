import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from '../users/user.entity';

@Entity('blocked_keywords')
export class BlockedKeyword {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  keyword!: string;

  @ManyToOne(() => User, { eager: true })
  addedBy!: User;

  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;
}
