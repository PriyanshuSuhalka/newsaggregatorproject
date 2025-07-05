// src/shared/mailer/mailer.service.ts
import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { User } from '@modules/users/user.entity';
import { Article } from '@modules/articles/article.entity';

@Injectable()
export class MailHelperService {
  constructor(private readonly mailer: MailerService) {}

  async sendArticleNotification(user: User, article: Article) {
    return this.mailer.sendMail({
      to: user.email,
      subject: `📰 New Article in ${article.category?.categoryName}`,
      html: `
        <p>Hello ${user.name || user.email},</p>
        <p>A new article was posted:</p>
        <h3>${article.articleTitle}</h3>
        <p>${article.articleContent?.slice(0, 300)}...</p>
        <a href="${article.URL}">Read full article</a>
        <br><br>
        <small>You received this notification because you subscribed to ${article.category?.categoryName}.</small>
      `,
    });
  }
}
