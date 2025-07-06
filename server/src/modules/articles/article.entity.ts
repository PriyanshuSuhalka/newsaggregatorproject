import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { Category } from "@modules/categories/category.entity";
import { ExternalAPI } from "@modules/externalapi/external-api.entity";
import { User } from "@modules/users/user.entity";

@Entity()
export class Article {
  @PrimaryGeneratedColumn() articleID!: number;

  @Column() articleTitle!: string;
  @Column() articleContent!: string;

  @Column() source!: string;
  @Column({ unique: true })
  URL!: string;

  @Column() publishDate!: Date;

  @Column({ default: false })
  isHidden!: boolean;

  @ManyToOne(() => User, { nullable: true })
  hiddenBy?: User;

  @Column({ nullable: true })
  hiddenAt?: Date;

  @ManyToOne(() => Category, { eager: true }) category!: Category;
  @ManyToOne(() => ExternalAPI, { eager: true }) externalAPI!: ExternalAPI;
}
