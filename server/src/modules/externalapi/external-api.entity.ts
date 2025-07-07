import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { Expose } from 'class-transformer';

@Entity()
export class ExternalAPI {
  @PrimaryGeneratedColumn() externalAPIID!: number;
  @Column() name!: string;
  @Column() APIURL!: string;
  @Column()
  @Expose() 
  key!: string;
  @Column() APIStatus!: number;
  @Column() lastAccessed!: Date;
}
