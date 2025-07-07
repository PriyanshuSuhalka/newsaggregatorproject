import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToOne, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';

@Entity('notification_config')
export class NotificationConfiguration {
  @PrimaryGeneratedColumn()
  id!: number;

  @OneToOne(() => User, { nullable: false, eager: true })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  // Store enabled category IDs as JSON array
  @Column('simple-json', { nullable: true })
  enabledCategoryIds?: number[];

  // Store keywords as JSON array
  @Column('simple-json', { nullable: true })
  keywords?: string[];

  @Column({ default: true })
  emailNotificationsEnabled!: boolean;
}