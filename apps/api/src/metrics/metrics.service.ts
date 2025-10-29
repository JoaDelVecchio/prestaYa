import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RequestContextService } from '../common/request-context.service';
import { InstallmentStatus } from '@prestaya/prisma';

type CashSummary = {
  totalCollected: number;
  pendingInstallments: number;
  overdueInstallments: number;
};

@Injectable()
export class MetricsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly context: RequestContextService,
  ) {}

  async cashSummary(): Promise<CashSummary> {
    const ctx = this.context.get();
    const [sumResult, pendingInstallments, overdueInstallments] =
      await Promise.all([
        this.prisma.payment.aggregate({
          where: { orgId: ctx.orgId },
          _sum: { amount: true },
        }),
        this.prisma.installment.count({
          where: {
            orgId: ctx.orgId,
            status: {
              in: [InstallmentStatus.PENDING, InstallmentStatus.OVERDUE],
            },
          },
        }),
        this.prisma.installment.count({
          where: {
            orgId: ctx.orgId,
            status: InstallmentStatus.OVERDUE,
          },
        }),
      ]);

    return {
      totalCollected: Number(sumResult._sum.amount ?? 0),
      pendingInstallments,
      overdueInstallments,
    };
  }
}
