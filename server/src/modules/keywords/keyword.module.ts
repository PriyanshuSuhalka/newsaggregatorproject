import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Keyword } from './keyword.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Keyword])],
  exports: [TypeOrmModule],
})
export class KeywordModule {}
