
import { Controller, Get, Query, NotFoundException } from '@nestjs/common';
import { MailHelperService } from '../mailer/mailer.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { Article } from '../articles/article.entity';

@Controller('mailer-test')
export class MailerTestController {
  constructor(
    private readonly mailHelperService: MailHelperService,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Article) private readonly articleRepo: Repository<Article>,
  ) {}

  @Get('send')
  async sendTestEmail(
    @Query('userId') userId: number,
    @Query('articleId') articleId: number,
  ) {
    const user = await this.userRepo.findOne({ where: { userID: userId } });
    const article = await this.articleRepo.findOne({ where: { articleID: articleId }, relations: ['category'] });
    if (!user || !article) {
      throw new NotFoundException('User or Article not found');
    }
    await this.mailHelperService.sendArticleNotification(user, article);
    return { message: 'Email sent (if SMTP is configured correctly)' };
  }
}
