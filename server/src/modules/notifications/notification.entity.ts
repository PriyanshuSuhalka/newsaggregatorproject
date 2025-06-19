import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from '@modules/users/user.entity';

@Entity()
export class Notification {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  message!: string;

  @ManyToOne(() => User, user => user.notifications)
  user!: User;
}
