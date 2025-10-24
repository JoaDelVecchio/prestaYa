import { CashSummary, Installment, Loan, OrgUser, Payment } from './types';

const globalStore = globalThis as typeof globalThis & { __mockDb?: MockDb };

const today = () => new Date();

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export type CreateLoanPayload = {
  borrowerName: string;
  borrowerPhone?: string;
  borrowerDni: string;
  principal: number;
  interestRate: number;
  numberOfInstallments: number;
  frequency: 'weekly' | 'biweekly' | 'monthly';
};

export type ChargePayload = {
  loanId: string;
  installmentId?: string;
  amount: number;
  method?: string;
};

const generateId = () => {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return `id-${Math.random().toString(36).slice(2, 11)}`;
};

class MockDb {
  private loans: Loan[] = [];
  private payments: Payment[] = [];
  private users: OrgUser[] = [];

  constructor() {
    this.seed();
  }

  private seed() {
    if (this.loans.length > 0) return;

    const baseLoan: Loan = {
      id: generateId(),
      borrowerName: 'Lucia Diaz',
      borrowerPhone: '+54 11 5555 0000',
      borrowerDni: '30123456',
      principal: 1500,
      interestRate: 15,
      frequency: 'weekly',
      status: 'PENDING',
      issuedAt: today().toISOString(),
      installments: this.generateInstallments({
        numberOfInstallments: 3,
        frequency: 'weekly',
        principal: 1500,
        interestRate: 15
      })
    };

    this.loans.push(baseLoan);
    this.users = [
      { id: '1', email: 'owner@prestaya.io', role: 'owner' },
      { id: '2', email: 'supervisor@prestaya.io', role: 'supervisor' },
      { id: '3', email: 'caja@prestaya.io', role: 'caja' },
      { id: '4', email: 'auditor@prestaya.io', role: 'readonly' }
    ];
  }

  listLoans(): Loan[] {
    return clone(this.loans);
  }

  createLoan(payload: CreateLoanPayload): Loan {
    const installments = this.generateInstallments({
      numberOfInstallments: payload.numberOfInstallments,
      frequency: payload.frequency,
      principal: payload.principal,
      interestRate: payload.interestRate
    });

    const loan: Loan = {
      id: generateId(),
      borrowerName: payload.borrowerName,
      borrowerPhone: payload.borrowerPhone,
      borrowerDni: payload.borrowerDni,
      principal: payload.principal,
      interestRate: payload.interestRate,
      frequency: payload.frequency,
      status: 'PENDING',
      issuedAt: today().toISOString(),
      installments
    };

    this.loans.push(loan);
    return clone(loan);
  }

  charge(payload: ChargePayload) {
    const loan = this.loans.find((item) => item.id === payload.loanId);
    if (!loan) {
      throw new Error('Loan not found');
    }

    const installment = payload.installmentId
      ? loan.installments.find((item) => item.id === payload.installmentId)
      : loan.installments.find((item) => item.status !== 'PAID');

    if (!installment) {
      throw new Error('Installment not found');
    }

    installment.status = 'PAID';
    installment.paidAt = today().toISOString();

    const payment: Payment = {
      id: generateId(),
      loanId: loan.id,
      installmentId: installment.id,
      amount: payload.amount,
      paidAt: installment.paidAt
    };
    this.payments.push(payment);

    if (loan.installments.every((item) => item.status === 'PAID')) {
      loan.status = 'PAID';
    } else {
      const overdueExists = loan.installments.some((item) => this.isOverdue(item));
      loan.status = overdueExists ? 'OVERDUE' : 'PENDING';
    }

    return { payment: clone(payment), loan: clone(loan) };
  }

  summary(): CashSummary {
    const totalCollected = this.payments.reduce((acc, payment) => acc + payment.amount, 0);
    const installments = this.loans.flatMap((loan) => loan.installments);

    const pendingInstallments = installments.filter((inst) => inst.status !== 'PAID').length;
    const overdueInstallments = installments.filter((inst) => this.isOverdue(inst)).length;

    return {
      totalCollected,
      pendingInstallments,
      overdueInstallments
    };
  }

  listUsers(): OrgUser[] {
    return clone(this.users);
  }

  listPayments(): Payment[] {
    return clone(this.payments);
  }

  private generateInstallments(params: {
    numberOfInstallments: number;
    frequency: 'weekly' | 'biweekly' | 'monthly';
    principal: number;
    interestRate: number;
  }): Installment[] {
    const total = params.principal * (1 + params.interestRate / 100);
    const amount = Number((total / params.numberOfInstallments).toFixed(2));
    const installments: Installment[] = [];
    const start = today();

    for (let i = 0; i < params.numberOfInstallments; i += 1) {
      const dueDate = new Date(start);
      if (params.frequency === 'weekly') {
        dueDate.setDate(dueDate.getDate() + (i + 1) * 7);
      } else if (params.frequency === 'biweekly') {
        dueDate.setDate(dueDate.getDate() + (i + 1) * 14);
      } else {
        dueDate.setMonth(dueDate.getMonth() + (i + 1));
      }

      installments.push({
        id: generateId(),
        sequence: i + 1,
        dueDate: dueDate.toISOString(),
        amount,
        status: 'PENDING'
      });
    }

    return installments;
  }

  private isOverdue(installment: Installment) {
    if (installment.status === 'PAID') return false;
    const due = new Date(installment.dueDate);
    return due.getTime() < today().getTime();
  }
}

if (!globalStore.__mockDb) {
  globalStore.__mockDb = new MockDb();
}

export const mockDb = globalStore.__mockDb;
