// src/shared/mailer/mailer.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailerModule as BaseMailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';

import { MailHelperService } from '@modules/mailer/mailer.service';
import { MailerTestController } from './mailer-test.controller';
import { User } from '../users/user.entity';
import { Article } from '../articles/article.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Article]),
    BaseMailerModule.forRoot({
      transport: {
        host: 'smtp.gmail.com', // replace with real config
        port: 465,
        secure: true,
        auth: {
          user: '2001idfake@gmail.com',
          pass: 'wrjhkchinwqajlym',
        },
      },
      defaults: {
        from: '"News Aggregator" <no-reply@news.com>',
      },
      template: {
        dir: join(__dirname, 'templates'),
        adapter: new HandlebarsAdapter(),
        options: {
          strict: true,
        },
      },
    }),
  ],
  providers: [MailHelperService],
  controllers: [MailerTestController],
  exports: [MailHelperService],
})
export class MailerModule {}
