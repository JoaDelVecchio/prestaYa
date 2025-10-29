import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma, LoanStatus, InstallmentStatus } from '@prestaya/prisma';
import { PrismaService } from '../prisma/prisma.service';
import { RequestContextService } from '../common/request-context.service';
import { ActivityService } from '../activity/activity.service';
import { CreateLoanDto } from './dto/create-loan.dto';
import { UpdateLoanDto } from './dto/update-loan.dto';
import { ChargeInstallmentDto } from './dto/charge-installment.dto';
import { ReceiptService } from '../receipts/receipt.service';
import { StopLoanDto } from './dto/stop-loan.dto';

@Injectable()
export class LoanService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly context: RequestContextService,
    private readonly activity: ActivityService,
    private readonly receiptService: ReceiptService,
  ) {}

  async create(dto: CreateLoanDto) {
    const ctx = this.context.get();
    const issuedAt = new Date();
    const firstDue = this.calculateFirstDueDate(issuedAt, dto.frequency);

    const total = dto.principal * (1 + dto.interestRate / 100);
    const installmentValue = parseFloat(
      (total / dto.numberOfInstallments).toFixed(2),
    );

    const installmentsData = this.generateInstallments({
      count: dto.numberOfInstallments,
      firstDueDate: firstDue,
      frequency: dto.frequency,
      amount: installmentValue,
    });

    const payload: Prisma.LoanCreateInput = {
      borrowerName: dto.borrowerName,
      borrowerPhone: dto.borrowerPhone,
      borrowerDni: dto.borrowerDni,
      externalId: dto.externalId,
      principal: new Prisma.Decimal(dto.principal),
      interestRate: new Prisma.Decimal(dto.interestRate),
      status: LoanStatus.PENDING,
      issuedAt,
      organisation: {
        connect: { id: ctx.orgId },
      },
      installments: {
        createMany: {
          data: installmentsData.map((installment, idx) => ({
            sequence: idx + 1,
            dueDate: installment.dueDate,
            amount: new Prisma.Decimal(installment.amount),
            orgId: ctx.orgId,
          })),
        },
      },
    };

    const loan = await this.prisma.loan.create({
      data: payload,
      include: {
        installments: {
          orderBy: { sequence: 'asc' },
        },
      },
    });

    await this.activity.log(
      loan.id,
      'loan.created',
      null,
      loan as unknown as Record<string, unknown>,
    );

    return loan;
  }

  async findAll() {
    const ctx = this.context.get();
    return this.prisma.loan.findMany({
      where: { orgId: ctx.orgId },
      include: {
        installments: { orderBy: { sequence: 'asc' } },
      },
    });
  }

  async findOne(id: string) {
    const ctx = this.context.get();
    const loan = await this.prisma.loan.findFirst({
      where: { id, orgId: ctx.orgId },
      include: {
        installments: { orderBy: { sequence: 'asc' } },
        payments: { orderBy: { paidAt: 'desc' } },
      },
    });

    if (!loan) {
      throw new NotFoundException('Loan not found');
    }

    return loan;
  }

  async update(id: string, dto: UpdateLoanDto) {
    const ctx = this.context.get();
    const existing = await this.findOne(id);

    const updated = await this.prisma.loan.update({
      where: { id },
      data: {
        borrowerName: dto.borrowerName,
        borrowerPhone: dto.borrowerPhone,
        borrowerDni: dto.borrowerDni,
        interestRate: dto.interestRate
          ? new Prisma.Decimal(dto.interestRate)
          : undefined,
        maturityDate: dto.maturityDate ? new Date(dto.maturityDate) : undefined,
        status: dto.status,
      },
      include: {
        installments: { orderBy: { sequence: 'asc' } },
      },
    });

    if (updated.orgId !== ctx.orgId) {
      throw new NotFoundException('Loan not found in organisation');
    }

    await this.activity.log(
      id,
      'loan.updated',
      existing,
      updated as unknown as Record<string, unknown>,
    );
    return updated;
  }

  async remove(id: string) {
    const ctx = this.context.get();
    const result = await this.prisma.loan.deleteMany({
      where: { id, orgId: ctx.orgId },
    });

    if (result.count === 0) {
      throw new NotFoundException('Loan not found');
    }

    await this.activity.log(id, 'loan.deleted', null, null);
    return { deleted: true };
  }

  async charge(id: string, dto: ChargeInstallmentDto) {
    const ctx = this.context.get();
    const loan = await this.findOne(id);

    const installment = await this.resolveInstallment(
      loan.id,
      dto.installmentId,
    );

    if (installment.status === InstallmentStatus.PAID) {
      throw new BadRequestException('Installment already paid');
    }

    const amountDecimal = new Prisma.Decimal(dto.amount);

    const payment = await this.prisma.payment.create({
      data: {
        amount: amountDecimal,
        installmentId: installment.id,
        loanId: loan.id,
        orgId: ctx.orgId,
        method: dto.method,
        metadata: {},
      },
    });

    await this.prisma.installment.update({
      where: { id: installment.id },
      data: {
        status: InstallmentStatus.PAID,
        paidAt: new Date(),
      },
    });

    const remainingPending = await this.prisma.installment.count({
      where: {
        loanId: loan.id,
        orgId: ctx.orgId,
        status: { in: [InstallmentStatus.PENDING, InstallmentStatus.OVERDUE] },
      },
    });

    if (remainingPending === 0) {
      await this.prisma.loan.update({
        where: { id: loan.id },
        data: { status: LoanStatus.PAID },
      });
    }

    const receipt = await this.receiptService.generateReceipt({
      orgId: ctx.orgId,
      loan,
      payment: {
        id: payment.id,
        amount: amountDecimal.toFixed(2),
        paidAt: payment.paidAt,
        method: payment.method ?? undefined,
      },
    });

    await this.prisma.receipt.create({
      data: {
        loanId: loan.id,
        orgId: ctx.orgId,
        paymentId: payment.id,
        storagePath: receipt.storagePath,
        signedUrl: receipt.signedUrl,
        expiresAt: receipt.expiresAt,
      },
    });

    await this.activity.log(loan.id, 'loan.installment_paid', null, {
      installmentId: installment.id,
      amount: dto.amount,
      paymentId: payment.id,
    });

    return {
      paymentId: payment.id,
      receiptUrl: receipt.signedUrl,
    };
  }

  async stop(id: string, dto: StopLoanDto) {
    const ctx = this.context.get();
    const loan = await this.findOne(id);
    const updated = await this.prisma.loan.update({
      where: { id },
      data: {
        isStopped: true,
        status:
          loan.status === LoanStatus.PAID
            ? LoanStatus.PAID
            : LoanStatus.REMINDED,
      },
    });

    await this.activity.log(id, 'loan.stopped', loan, {
      ...loan,
      isStopped: true,
      stopReason: dto.reason,
    } as unknown as Record<string, unknown>);

    return updated;
  }

  private async resolveInstallment(loanId: string, installmentId?: string) {
    const ctx = this.context.get();
    if (installmentId) {
      const installment = await this.prisma.installment.findFirst({
        where: { id: installmentId, loanId, orgId: ctx.orgId },
      });
      if (!installment) {
        throw new NotFoundException('Installment not found');
      }
      return installment;
    }

    const next = await this.prisma.installment.findFirst({
      where: {
        loanId,
        orgId: ctx.orgId,
        status: { in: [InstallmentStatus.PENDING, InstallmentStatus.OVERDUE] },
      },
      orderBy: { dueDate: 'asc' },
    });

    if (!next) {
      throw new BadRequestException('No pending installments');
    }

    return next;
  }

  private generateInstallments(params: {
    count: number;
    firstDueDate: Date;
    frequency: 'weekly' | 'biweekly' | 'monthly';
    amount: number;
  }) {
    const installments: { dueDate: Date; amount: number }[] = [];
    for (let i = 0; i < params.count; i += 1) {
      const dueDate = new Date(params.firstDueDate);
      if (params.frequency === 'weekly') {
        dueDate.setDate(dueDate.getDate() + i * 7);
      } else if (params.frequency === 'biweekly') {
        dueDate.setDate(dueDate.getDate() + i * 14);
      } else {
        dueDate.setMonth(dueDate.getMonth() + i);
      }
      installments.push({ dueDate, amount: params.amount });
    }
    return installments;
  }

  private calculateFirstDueDate(
    issuedAt: Date,
    frequency: 'weekly' | 'biweekly' | 'monthly',
  ) {
    const firstDue = new Date(issuedAt);
    firstDue.setHours(0, 0, 0, 0);
    if (frequency === 'weekly') {
      firstDue.setDate(firstDue.getDate() + 7);
    } else if (frequency === 'biweekly') {
      firstDue.setDate(firstDue.getDate() + 14);
    } else {
      firstDue.setMonth(firstDue.getMonth() + 1);
    }
    return firstDue;
  }
}
