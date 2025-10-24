import { BadRequestException, Body, Controller, Headers, Post, ForbiddenException } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { PaymentReceivedDto } from './dto/payment-received.dto';
import { LoanService } from '../loans/loan.service';
import { RequestContextService } from '../common/request-context.service';

@Controller('webhooks/n8n')
export class WebhookController {
  constructor(
    private readonly loans: LoanService,
    private readonly context: RequestContextService
  ) {}

  @Post('payment-received')
  @Public()
  async paymentReceived(
    @Body() dto: PaymentReceivedDto,
    @Headers('x-org-id') orgId?: string,
    @Headers('x-webhook-secret') secret?: string
  ) {
    const expectedSecret = process.env.N8N_WEBHOOK_SECRET || process.env.WEBHOOK_SECRET;
    if (expectedSecret && secret !== expectedSecret) {
      throw new ForbiddenException('Invalid webhook secret');
    }

    if (!orgId) {
      throw new BadRequestException('Missing organisation header');
    }

    return this.context.run(
      {
        orgId,
        userId: 'n8n-webhook',
        role: 'owner'
      },
      () =>
        this.loans.charge(dto.loanId, {
          installmentId: dto.installmentId,
          amount: dto.amount,
          method: dto.method
        })
    );
  }
}
