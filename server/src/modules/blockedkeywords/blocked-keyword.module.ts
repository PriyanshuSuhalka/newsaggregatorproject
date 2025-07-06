import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlockedKeyword } from './blocked-keyword.entity';
import { BlockedKeywordService } from './blocked-keyword.service';
import { BlockedKeywordController } from './blocked-keyword.controller';
import { User } from '../users/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BlockedKeyword, User])],
  providers: [BlockedKeywordService],
  controllers: [BlockedKeywordController],
  exports: [BlockedKeywordService],
})
export class BlockedKeywordModule {}
