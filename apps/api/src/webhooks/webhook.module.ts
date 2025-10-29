import { Module } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { LoanModule } from '../loans/loan.module';
import { ActivityModule } from '../activity/activity.module';

@Module({
  imports: [LoanModule, ActivityModule],
  controllers: [WebhookController],
})
export class WebhookModule {}
