import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SavedArticle } from './saved-article.entity';
import { CreateSavedArticleDto } from './dto/create-saved-article.dto';

@Injectable()
export class SavedArticleService {
  constructor(
    @InjectRepository(SavedArticle)
    private savedRepo: Repository<SavedArticle>
  ) {}

  async save(dto: CreateSavedArticleDto) {
    const savedArticle = this.savedRepo.create(dto as unknown as Partial<SavedArticle>);
    return await this.savedRepo.save(savedArticle);
  }

  async findByUser(userId: number) {
    return await this.savedRepo.find({
      where: { user: { userID: userId } },
      relations: ['article'],
    });
  }
}
