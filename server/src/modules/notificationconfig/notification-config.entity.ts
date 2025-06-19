import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from '../users/user.entity';

@Entity()
export class NotificationConfiguration {
  @PrimaryGeneratedColumn() configurationID!: number;
  @ManyToOne(() => User) user!: User;
  @Column() categories!: string;
  @Column() keywords!: string;
}