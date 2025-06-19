import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from '../users/user.entity';

@Entity()
export class Keyword {
  @PrimaryGeneratedColumn() keywordID!: number;
  @ManyToOne(() => User) user!: User;
  @Column() keywords!: string;
}