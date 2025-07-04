// modules/externalapi/external-api.cron.ts
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ExternalApiService } from './externalapi.service';

@Injectable()
export class ExternalApiCron {
  constructor(private readonly externalApiService: ExternalApiService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  handleCron() {
    console.log('[CRON] Fetching articles from external APIs...');
    this.externalApiService.fetchAndSaveArticles().catch((err) => {
      console.error('[CRON] Error during article fetch:', err.message);
    });
  }
}
