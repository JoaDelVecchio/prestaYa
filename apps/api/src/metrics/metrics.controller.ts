import { Controller, Get } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('summary')
export class MetricsController {
  constructor(private readonly metrics: MetricsService) {}

  @Get()
  @Roles('owner', 'supervisor', 'caja', 'readonly')
  cashSummary() {
    return this.metrics.cashSummary();
  }
}
