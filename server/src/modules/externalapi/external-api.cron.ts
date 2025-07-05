// modules/externalapi/external-api.cron.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ExternalApiService } from './externalapi.service';

@Injectable()
export class ExternalApiCron {
  private readonly logger = new Logger(ExternalApiCron.name);

  constructor(private readonly externalApiService: ExternalApiService) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async handleCron() {
    const startTime = new Date();
    this.logger.log(`🔄 [CRON] Starting article fetch and notification cycle...`);
    
    try {
      await this.externalApiService.fetchAndSaveArticles();
      
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();
      this.logger.log(`✅ [CRON] Article fetch completed successfully in ${duration}ms`);
    } catch (err: any) {
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();
      this.logger.error(`❌ [CRON] Error during article fetch after ${duration}ms: ${err.message}`);
    }
  }

  // For testing purposes - trigger manual fetch
  async triggerManualFetch(): Promise<void> {
    this.logger.log(`🔧 [MANUAL] Manual article fetch triggered`);
    await this.handleCron();
  }
}
