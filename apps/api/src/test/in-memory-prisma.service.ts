import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { InstallmentStatus, LoanStatus } from '@prestaya/prisma';

type LoanRecord = {
  id: string;
  orgId: string;
  borrowerName: string;
  borrowerPhone?: string | null;
  borrowerDni?: string | null;
  externalId?: string | null;
  principal: number;
  interestRate: number;
  status: LoanStatus;
  issuedAt: Date;
  maturityDate?: Date | null;
  isStopped: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type InstallmentRecord = {
  id: string;
  loanId: string;
  orgId: string;
  sequence: number;
  dueDate: Date;
  amount: number;
  status: InstallmentStatus;
  paidAt?: Date | null;
};

type PaymentRecord = {
  id: string;
  loanId: string;
  installmentId?: string | null;
  orgId: string;
  amount: number;
  paidAt: Date;
  method?: string | null;
  metadata?: Record<string, unknown> | null;
};

type ActivityRecord = {
  id: string;
  orgId: string;
  loanId?: string | null;
  actorId?: string | null;
  action: string;
  diff: Record<string, unknown>;
  dayHash: string;
  createdAt: Date;
};

type ReceiptRecord = {
  id: string;
  orgId: string;
  loanId: string;
  paymentId?: string | null;
  storagePath: string;
  signedUrl?: string | null;
  expiresAt?: Date | null;
};

@Injectable()
export class InMemoryPrismaService {
  private loans: LoanRecord[] = [];
  private installments: InstallmentRecord[] = [];
  private payments: PaymentRecord[] = [];
  private activities: ActivityRecord[] = [];
  private receipts: ReceiptRecord[] = [];

  loan = {
    create: async ({ data, include }: any) => {
      const id = data.id ?? randomUUID();
      const now = new Date();
      const orgIdFromRelation = data.orgId ?? data.organisation?.connect?.id;
      if (!orgIdFromRelation) {
        throw new Error('orgId is required in create');
      }
      const record: LoanRecord = {
        id,
        orgId: orgIdFromRelation,
        borrowerName: data.borrowerName,
        borrowerPhone: data.borrowerPhone,
        borrowerDni: data.borrowerDni,
        externalId: data.externalId,
        principal: Number(data.principal),
        interestRate: Number(data.interestRate),
        status: data.status ?? LoanStatus.PENDING,
        issuedAt: data.issuedAt ?? now,
        maturityDate: data.maturityDate ?? null,
        isStopped: false,
        createdAt: now,
        updatedAt: now
      };
      this.loans.push(record);

      if (data.installments?.createMany?.data) {
        data.installments.createMany.data.forEach((inst: any, index: number) => {
          this.installments.push({
            id: randomUUID(),
            loanId: record.id,
            orgId: inst.orgId ?? orgIdFromRelation,
            sequence: inst.sequence ?? index + 1,
            dueDate: new Date(inst.dueDate),
            amount: Number(inst.amount),
            status: InstallmentStatus.PENDING,
            paidAt: null
          });
        });
      }

      return this.decorateLoan(record, include);
    },
    findMany: async ({ where, include }: any) => {
      const filtered = this.loans.filter((loan) => {
        if (where?.orgId && loan.orgId !== where.orgId) {
          return false;
        }
        if (where?.status && loan.status !== where.status) {
          return false;
        }
        return true;
      });
      return filtered.map((loan) => this.decorateLoan(loan, include));
    },
    findFirst: async ({ where, include }: any) => {
      const loan = this.loans.find((item) => {
        if (where?.id && item.id !== where.id) {
          return false;
        }
        if (where?.orgId && item.orgId !== where.orgId) {
          return false;
        }
        return true;
      });
      return loan ? this.decorateLoan(loan, include) : null;
    },
    update: async ({ where, data, include }: any) => {
      const loan = this.loans.find((item) => item.id === where.id);
      if (!loan) {
        throw new Error('Loan not found');
      }
      Object.assign(loan, {
        borrowerName: data.borrowerName ?? loan.borrowerName,
        borrowerPhone: data.borrowerPhone ?? loan.borrowerPhone,
        borrowerDni: data.borrowerDni ?? loan.borrowerDni,
        interestRate: data.interestRate ? Number(data.interestRate) : loan.interestRate,
        maturityDate: data.maturityDate ? new Date(data.maturityDate) : loan.maturityDate,
        status: data.status ?? loan.status,
        isStopped: data.isStopped ?? loan.isStopped,
        updatedAt: new Date()
      });
      return this.decorateLoan(loan, include);
    },
    deleteMany: async ({ where }: any) => {
      const before = this.loans.length;
      this.loans = this.loans.filter((loan) => loan.id !== where.id || loan.orgId !== where.orgId);
      const after = this.loans.length;
      return { count: before - after };
    }
  };

  installment = {
    findFirst: async ({ where, orderBy }: any) => {
      let list = this.installments.filter((inst) => {
        if (where?.id && inst.id !== where.id) {
          return false;
        }
        if (where?.loanId && inst.loanId !== where.loanId) {
          return false;
        }
        if (where?.orgId && inst.orgId !== where.orgId) {
          return false;
        }
        if (where?.status?.in && !where.status.in.includes(inst.status)) {
          return false;
        }
        return true;
      });
      if (orderBy?.dueDate === 'asc') {
        list = list.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
      }
      if (orderBy?.sequence === 'asc') {
        list = list.sort((a, b) => a.sequence - b.sequence);
      }
      return list[0] ?? null;
    },
    update: async ({ where, data }: any) => {
      const inst = this.installments.find((item) => item.id === where.id);
      if (!inst) {
        throw new Error('Installment not found');
      }
      Object.assign(inst, {
        status: data.status ?? inst.status,
        paidAt: data.paidAt ? new Date(data.paidAt) : inst.paidAt
      });
      return inst;
    },
    count: async ({ where }: any) => {
      return this.installments.filter((inst) => {
        if (where.orgId && inst.orgId !== where.orgId) {
          return false;
        }
        if (where.loanId && inst.loanId !== where.loanId) {
          return false;
        }
        if (where.status?.in && !where.status.in.includes(inst.status)) {
          return false;
        }
        return true;
      }).length;
    }
  };

  payment = {
    create: async ({ data }: any) => {
      const record: PaymentRecord = {
        id: randomUUID(),
        loanId: data.loanId,
        installmentId: data.installmentId,
        orgId: data.orgId,
        amount: Number(data.amount),
        method: data.method,
        metadata: data.metadata,
        paidAt: new Date()
      };
      this.payments.push(record);
      return record;
    }
  };

  receipt = {
    create: async ({ data }: any) => {
      const record: ReceiptRecord = {
        id: randomUUID(),
        orgId: data.orgId,
        loanId: data.loanId,
        paymentId: data.paymentId,
        storagePath: data.storagePath,
        signedUrl: data.signedUrl,
        expiresAt: data.expiresAt
      };
      this.receipts.push(record);
      return record;
    }
  };

  activityLog = {
    create: async ({ data }: any) => {
      const record: ActivityRecord = {
        id: randomUUID(),
        orgId: data.orgId,
        loanId: data.loanId,
        actorId: data.actorId,
        action: data.action,
        diff: data.diff,
        dayHash: data.dayHash,
        createdAt: data.createdAt
      };
      this.activities.push(record);
      return record;
    },
    findMany: async ({ where, orderBy }: any) => {
      let list = this.activities.filter((activity) => {
        if (where.orgId && activity.orgId !== where.orgId) {
          return false;
        }
        if (where.loanId && activity.loanId !== where.loanId) {
          return false;
        }
        return true;
      });
      if (orderBy?.createdAt === 'desc') {
        list = list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      }
      return list;
    }
  };

  private decorateLoan(record: LoanRecord, include?: any) {
    const base = { ...record } as any;
    if (include?.installments) {
      let list = this.installments.filter((inst) => inst.loanId === record.id);
      if (include.installments.orderBy?.sequence === 'asc') {
        list = list.sort((a, b) => a.sequence - b.sequence);
      }
      base.installments = list;
    }
    if (include?.payments) {
      let list = this.payments.filter((pay) => pay.loanId === record.id);
      if (include.payments.orderBy?.paidAt === 'desc') {
        list = list.sort((a, b) => b.paidAt.getTime() - a.paidAt.getTime());
      }
      base.payments = list;
    }
    return base;
  }
}
