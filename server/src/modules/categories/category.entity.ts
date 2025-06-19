import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Category {
  @PrimaryGeneratedColumn() categoryID!: number;
  @Column() categoryName!: string;
}