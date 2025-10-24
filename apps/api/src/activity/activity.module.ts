import { Module } from '@nestjs/common';
import { ActivityService } from './activity.service';
import { RequestContextService } from '../common/request-context.service';

@Module({
  providers: [ActivityService, RequestContextService],
  exports: [ActivityService]
})
export class ActivityModule {}
