import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RequestContextService } from '../common/request-context.service';

type PaymentResponse = {
  id: string;
  loanId: string;
  installmentId: string | null;
  orgId: string;
  amount: number;
  paidAt: string;
  method: string | null;
};

@Injectable()
export class PaymentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly context: RequestContextService,
  ) {}

  async list(): Promise<PaymentResponse[]> {
    const ctx = this.context.get();
    const payments = await this.prisma.payment.findMany({
      where: { orgId: ctx.orgId },
      orderBy: { paidAt: 'desc' },
    });

    return payments.map((payment) => ({
      id: payment.id,
      loanId: payment.loanId,
      installmentId: payment.installmentId ?? null,
      orgId: payment.orgId,
      amount: payment.amount.toNumber(),
      paidAt: payment.paidAt.toISOString(),
      method: payment.method ?? null,
    }));
  }
}
