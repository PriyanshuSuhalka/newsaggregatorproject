import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserHistory } from './user-history.entity';
import { User } from '../users/user.entity';
import { Article } from '../articles/article.entity';

@Injectable()
export class UserHistoryService {
  constructor(
    @InjectRepository(UserHistory)
    private readonly userHistoryRepository: Repository<UserHistory>,
  ) {}

  async addArticleToHistory(user: User, article: Article): Promise<UserHistory> {
    const historyEntry = this.userHistoryRepository.create({ user, article });
    return this.userHistoryRepository.save(historyEntry);
  }

  async getHistoryForUser(user: User): Promise<UserHistory[]> {
    return this.userHistoryRepository.find({ where: { user } });
  }
}
