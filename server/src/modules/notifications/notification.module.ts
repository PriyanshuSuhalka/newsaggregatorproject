import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { ExternalApiService } from '@modules/externalapi/externalapi.service';
import { NewsApiAdapter } from '@modules/externalapi/adapters/newsapi.adapter';
import { TheNewsApiAdapter } from '@modules/externalapi/adapters/thenewsapi.adapter';
import { ExternalApiModule } from '@modules/externalapi/externalapi.module';

@Module({
    imports: [ExternalApiModule],
    providers: [
    NotificationService,
    ExternalApiService,
    NewsApiAdapter,
    TheNewsApiAdapter,
  ],
  exports: [NotificationService], 
})
export class NotificationModule {}
