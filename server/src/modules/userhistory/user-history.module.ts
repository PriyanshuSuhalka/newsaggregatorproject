import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserHistory } from './user-history.entity';
import { User } from '../users/user.entity';
import { UserHistoryService } from './user-history.service';
import { UserHistoryController } from './user-history.controller';
import { ArticleModule } from '../articles/article.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserHistory, User]),
    forwardRef(() => ArticleModule),
  ],
  providers: [UserHistoryService],
  controllers: [UserHistoryController],
  exports: [UserHistoryService],
})
export class UserHistoryModule {}
