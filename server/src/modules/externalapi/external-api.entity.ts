import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class ExternalAPI {
  @PrimaryGeneratedColumn() externalAPIID!: number;
  @Column() name!: string;
  @Column() APIURL!: string;
  @Column() key!: string;
  @Column() APIStatus!: number;
  @Column() lastAccessed!: Date;
}