import {
  Controller,
  Post,
  Body,
  NotFoundException,
  Get,
  Param,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SavedArticle } from './saved-article.entity';
import { Article } from '@modules/articles/article.entity';
import { User } from '@modules/users/user.entity';
import { CreateSavedArticleDto } from './dto/create-saved-article.dto';

@Controller('saved-articles')
export class SavedArticleController {
  constructor(
    @InjectRepository(SavedArticle)
    private savedRepo: Repository<SavedArticle>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Article)
    private articleRepo: Repository<Article>,
  ) {}

  @Post()
  async saveArticle(@Body() dto: CreateSavedArticleDto) {
    const user = await this.userRepo.findOne({
      where: { userID: dto.userId },
    });
    const article = await this.articleRepo.findOne({
      where: { articleID: dto.articleId },
    });

    if (!user) throw new NotFoundException('User not found');
    if (!article) throw new NotFoundException('Article not found');

    const alreadySaved = await this.savedRepo.findOne({
      where: {
        user: { userID: user.userID },
        article: { articleID: article.articleID },
      },
    });

    if (alreadySaved) {
      return { message: 'Article already bookmarked' };
    }

    const saved = this.savedRepo.create({ user, article });
    await this.savedRepo.save(saved);

    return { message: 'Article bookmarked successfully' };
  }

  @Get(':userId')
  async getSavedArticles(@Param('userId') userId: number) {
    const user = await this.userRepo.findOne({ where: { userID: userId } });
    if (!user) throw new NotFoundException('User not found');

    const savedArticles = await this.savedRepo.find({
      where: { user: { userID: user.userID } },
      relations: ['article'],
    });

    return savedArticles;
  }
}
