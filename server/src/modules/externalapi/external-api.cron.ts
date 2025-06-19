import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ExternalApiService } from './external-api.service';

@Injectable()
export class ExternalApiCron {
  constructor(private readonly externalApiService: ExternalApiService) {}

  @Cron(CronExpression.EVERY_3_HOURS)
  handleCron() {
    console.log('Fetching articles from external APIs...');
    this.externalApiService.fetchAndSaveArticles().catch((err) => {
      console.error('Error during article fetch:', err.message);
    });
  }
}
