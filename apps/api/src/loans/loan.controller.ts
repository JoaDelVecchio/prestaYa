import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { LoanService } from './loan.service';
import { CreateLoanDto } from './dto/create-loan.dto';
import { UpdateLoanDto } from './dto/update-loan.dto';
import { ChargeInstallmentDto } from './dto/charge-installment.dto';
import { StopLoanDto } from './dto/stop-loan.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { ActivityService } from '../activity/activity.service';

@Controller('loans')
export class LoanController {
  constructor(
    private readonly loans: LoanService,
    private readonly activity: ActivityService
  ) {}

  @Post()
  @Roles('owner', 'supervisor')
  create(@Body() dto: CreateLoanDto) {
    return this.loans.create(dto);
  }

  @Get()
  @Roles('owner', 'supervisor', 'caja', 'readonly')
  findAll() {
    return this.loans.findAll();
  }

  @Get(':id')
  @Roles('owner', 'supervisor', 'caja', 'readonly')
  findOne(@Param('id') id: string) {
    return this.loans.findOne(id);
  }

  @Patch(':id')
  @Roles('owner', 'supervisor')
  update(@Param('id') id: string, @Body() dto: UpdateLoanDto) {
    return this.loans.update(id, dto);
  }

  @Delete(':id')
  @Roles('owner')
  remove(@Param('id') id: string) {
    return this.loans.remove(id);
  }

  @Post(':id/charge')
  @Roles('owner', 'supervisor', 'caja')
  charge(@Param('id') id: string, @Body() dto: ChargeInstallmentDto) {
    return this.loans.charge(id, dto);
  }

  @Post(':id/stop')
  @Roles('owner', 'supervisor')
  stop(@Param('id') id: string, @Body() dto: StopLoanDto) {
    return this.loans.stop(id, dto);
  }

  @Get(':id/activity')
  @Roles('owner', 'supervisor', 'caja', 'readonly')
  activityForLoan(@Param('id') id: string) {
    return this.activity.listForLoan(id);
  }
}
