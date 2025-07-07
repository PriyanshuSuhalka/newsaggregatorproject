import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Keyword } from './keyword.entity';

@Injectable()
export class KeywordService {
  constructor(
    @InjectRepository(Keyword)
    private readonly keywordRepository: Repository<Keyword>,
  ) {}

  async getKeywordsForUser(userId: number): Promise<Keyword[]> {
    // This is a placeholder implementation. In a real application, you would
    // likely have a relationship between users and keywords.
    return this.keywordRepository.find();
  }
}
