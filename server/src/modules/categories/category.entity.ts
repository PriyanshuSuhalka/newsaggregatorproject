import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from '@modules/users/user.entity';

@Entity()
export class Category {
  @PrimaryGeneratedColumn() categoryID!: number;
  @Column() categoryName!: string;

  @Column({ default: false })
  isHidden!: boolean;

  @ManyToOne(() => User, { nullable: true })
  hiddenBy?: User;

  @Column({ nullable: true })
  hiddenAt?: Date;
}