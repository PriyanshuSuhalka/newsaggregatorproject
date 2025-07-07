import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from "typeorm";
import { Category } from "@modules/categories/category.entity";
import { ExternalAPI } from "@modules/externalapi/external-api.entity";
import { User } from "@modules/users/user.entity";
import { UserHistory } from "@modules/userhistory/user-history.entity";

@Entity()
export class Article {
  @PrimaryGeneratedColumn() articleID!: number;

  @Column({ length: 1000 }) articleTitle!: string;
  @Column('longtext') articleContent!: string;

  @Column({ length: 500 }) source!: string;
  @Column({ length: 500, nullable: true })
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

  @OneToMany(() => UserHistory, (uh) => uh.article)
  history!: UserHistory[];
}
