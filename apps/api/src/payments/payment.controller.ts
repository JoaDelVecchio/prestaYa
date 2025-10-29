import { Controller, Get } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('payments')
export class PaymentController {
  constructor(private readonly payments: PaymentService) {}

  @Get()
  @Roles('owner', 'supervisor', 'caja', 'readonly')
  list() {
    return this.payments.list();
  }
}
