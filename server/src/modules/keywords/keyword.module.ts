import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Keyword } from './keyword.entity';
import { KeywordService } from './keyword.service';

@Module({
  imports: [TypeOrmModule.forFeature([Keyword])],
  providers: [KeywordService],
  exports: [TypeOrmModule, KeywordService],
})
export class KeywordModule {}
