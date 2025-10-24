import { Module } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { LoanModule } from '../loans/loan.module';
import { ActivityModule } from '../activity/activity.module';
import { RequestContextService } from '../common/request-context.service';

@Module({
  imports: [LoanModule, ActivityModule],
  controllers: [WebhookController],
  providers: [RequestContextService]
})
export class WebhookModule {}
