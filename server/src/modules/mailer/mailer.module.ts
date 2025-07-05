// src/shared/mailer/mailer.module.ts
import { Module } from '@nestjs/common';
import { MailerModule as BaseMailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';
import { MailHelperService } from '@modules/mailer/mailer.service';

@Module({
  imports: [
    BaseMailerModule.forRoot({
      transport: {
        host: 'smtp.gmail.com', // replace with real config
        port: 587,
        secure: true,
        auth: {
          user: 'idforbasicuse2001@gmail.com',
          pass: 'Jaimatadi@123',
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
  exports: [MailHelperService],
})
export class MailerModule {}
