import { Module } from '@nestjs/common';
import { ArticleMatchingService } from './article-matching.service';

@Module({
  providers: [ArticleMatchingService],
  exports: [ArticleMatchingService],
})
export class MatchingModule {}
