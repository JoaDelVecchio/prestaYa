import { Test } from '@nestjs/testing';
import { LoanService } from './loan.service';
import { PrismaService } from '../prisma/prisma.service';
import { RequestContextService } from '../common/request-context.service';
import { ActivityService } from '../activity/activity.service';
import { ReceiptService } from '../receipts/receipt.service';
import { InMemoryPrismaService } from '../test/in-memory-prisma.service';
import { InstallmentStatus, LoanStatus } from '@prestaya/prisma';
import { ChargeInstallmentDto } from './dto/charge-installment.dto';

class FakeReceiptService {
  async generateReceipt() {
    return {
      storagePath: 'receipts/test.pdf',
      signedUrl: 'http://example.com/receipt.pdf',
      expiresAt: new Date()
    };
  }
}

describe('LoanService', () => {
  let service: LoanService;
  let context: RequestContextService;
  let prisma: InMemoryPrismaService;

  const ctx = {
    orgId: 'org-123',
    userId: 'user-456',
    role: 'owner' as const,
    email: 'owner@example.com'
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        LoanService,
        ActivityService,
        RequestContextService,
        { provide: PrismaService, useClass: InMemoryPrismaService },
        { provide: ReceiptService, useClass: FakeReceiptService }
      ]
    }).compile();

    service = moduleRef.get(LoanService);
    context = moduleRef.get(RequestContextService);
    prisma = moduleRef.get(PrismaService);
  });

  const createLoanDto = {
    borrowerName: 'Juan Perez',
    borrowerPhone: '+541100000000',
    borrowerDni: '30123456',
    principal: 1000,
    interestRate: 20,
    numberOfInstallments: 4,
    firstDueDate: new Date().toISOString(),
    frequency: 'weekly' as const
  };

  it('creates a loan with installments and logs activity', async () => {
    const loan = await context.run(ctx, () => service.create(createLoanDto));

    expect(loan.borrowerName).toBe('Juan Perez');
    expect(loan.installments).toHaveLength(4);
    expect(loan.installments[0].status).toBe(InstallmentStatus.PENDING);

    const activities = await prisma.activityLog.findMany({
      where: { loanId: loan.id, orgId: ctx.orgId },
      orderBy: { createdAt: 'desc' }
    });
    expect(activities[0].action).toBe('loan.created');
  });

  it('charges the next pending installment and generates receipt', async () => {
    const loan = await context.run(ctx, () => service.create(createLoanDto));
    const installmentId = loan.installments[0].id;

    const result = await context.run(ctx, () =>
      service.charge(loan.id, {
        installmentId,
        amount: 300,
        method: 'cash'
      })
    );

    expect(result.receiptUrl).toContain('http');

    const updatedInstallment = await prisma.installment.findFirst({
      where: { id: installmentId, loanId: loan.id, orgId: ctx.orgId }
    });
    expect(updatedInstallment?.status).toBe(InstallmentStatus.PAID);

    const updatedLoan = await context.run(ctx, () => service.findOne(loan.id));
    expect(updatedLoan.payments[0].method).toBe('cash');
  });

  it('marks loan as stopped and records activity', async () => {
    const loan = await context.run(ctx, () => service.create(createLoanDto));

    const updated = await context.run(ctx, () => service.stop(loan.id, { reason: 'Cliente optó por cierre' }));

    expect(updated.isStopped).toBe(true);
    const activities = await prisma.activityLog.findMany({
      where: { loanId: loan.id, orgId: ctx.orgId }
    });
    expect(activities.some((item) => item.action === 'loan.stopped')).toBe(true);
  });

  it('removes a loan respecting org isolation', async () => {
    const loan = await context.run(ctx, () => service.create(createLoanDto));

    const result = await context.run(ctx, () => service.remove(loan.id));
    expect(result.deleted).toBe(true);

    await expect(context.run(ctx, () => service.findOne(loan.id))).rejects.toThrow('Loan not found');
  });

  it('updates loan fields and logs change', async () => {
    const loan = await context.run(ctx, () => service.create(createLoanDto));

    const updated = await context.run(ctx, () =>
      service.update(loan.id, { borrowerName: 'Maria Gomez', status: LoanStatus.REMINDED })
    );

    expect(updated.borrowerName).toBe('Maria Gomez');

    const activities = await prisma.activityLog.findMany({ where: { loanId: loan.id, action: 'loan.updated' } });
    expect(activities.length).toBeGreaterThan(0);
  });

  it('lists loans filtered by organisation', async () => {
    await context.run(ctx, () => service.create(createLoanDto));

    const loans = await context.run(ctx, () => service.findAll());
    expect(loans.length).toBeGreaterThan(0);
  });

  it('marks loan as paid when all installments are charged', async () => {
    const singleInstallmentLoan = await context.run(ctx, () =>
      service.create({
        ...createLoanDto,
        principal: 100,
        numberOfInstallments: 1
      })
    );

    await context.run(ctx, () =>
      service.charge(singleInstallmentLoan.id, {
        amount: 110,
        method: 'cash'
      })
    );

    const refreshed = await context.run(ctx, () => service.findOne(singleInstallmentLoan.id));
    expect(refreshed.status).toBe(LoanStatus.PAID);
  });

  it('throws when attempting to charge with no pending installments', async () => {
    const singleInstallmentLoan = await context.run(ctx, () =>
      service.create({
        ...createLoanDto,
        principal: 200,
        numberOfInstallments: 1
      })
    );

    await context.run(ctx, () => service.charge(singleInstallmentLoan.id, { amount: 220 }));

    await expect(context.run(ctx, () => service.charge(singleInstallmentLoan.id, { amount: 220 }))).rejects.toThrow(
      'No pending installments'
    );
  });
});
