import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from '../users/user.entity';
import { Category } from '../categories/category.entity';

@Entity()
export class CategoriesConfiguration {
  @PrimaryGeneratedColumn() categoryConfigurationID!: number;
  @ManyToOne(() => User) user!: User;
  @ManyToOne(() => Category) category!: Category;
  @Column() isEnabled!: number;
}