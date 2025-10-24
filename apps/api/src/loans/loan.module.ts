import { Module } from '@nestjs/common';
import { LoanService } from './loan.service';
import { LoanController } from './loan.controller';
import { ActivityModule } from '../activity/activity.module';
import { ReceiptModule } from '../receipts/receipt.module';
import { RequestContextService } from '../common/request-context.service';

@Module({
  imports: [ActivityModule, ReceiptModule],
  controllers: [LoanController],
  providers: [LoanService, RequestContextService],
  exports: [LoanService]
})
export class LoanModule {}
