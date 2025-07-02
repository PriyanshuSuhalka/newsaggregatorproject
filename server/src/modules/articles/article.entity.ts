import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { Category } from "@modules/categories/category.entity";
import { ExternalAPI } from "@modules/externalapi/external-api.entity";

@Entity()
export class Article {
  @PrimaryGeneratedColumn() articleID!: number;

  @Column() articleTitle!: string;
  @Column() articleContent!: string;

  @Column() source!: string;
  @Column({ unique: true })
  URL!: string;

  @Column() publishDate!: Date;

  @ManyToOne(() => Category, { eager: true }) category!: Category;
  @ManyToOne(() => ExternalAPI, { eager: true }) externalAPI!: ExternalAPI;
}
