import type { CashSummary, Loan, OrgUser, Payment } from './types';

type RawInstallment = {
  id: string;
  sequence: number;
  dueDate: string;
  amount: number | string;
  status: Loan['installments'][number]['status'];
  paidAt?: string | null;
};

export type RawLoan = {
  id: string;
  borrowerName: string;
  borrowerPhone?: string | null;
  borrowerDni?: string | null;
  principal: number | string;
  interestRate: number | string;
  status: Loan['status'];
  issuedAt: string;
  frequency?: Loan['frequency'] | null;
  installments: RawInstallment[];
};

export type RawPayment = {
  id: string;
  loanId: string;
  installmentId?: string | null;
  orgId?: string;
  amount: number | string;
  paidAt: string;
  method?: string | null;
};

export type RawUser = {
  id: string;
  email: string;
  role: OrgUser['role'] | string;
};

const WEEK_IN_MS = 7 * 24 * 60 * 60 * 1000;
const BIWEEK_IN_MS = 14 * 24 * 60 * 60 * 1000;

function toNumber(value: number | string | null | undefined): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

function inferFrequency(installments: RawInstallment[]): Loan['frequency'] {
  if (installments.length < 2) {
    return 'monthly';
  }

  const first = new Date(installments[0].dueDate);
  const second = new Date(installments[1].dueDate);
  const diff = Math.abs(second.getTime() - first.getTime());

  if (diff <= WEEK_IN_MS + 24 * 60 * 60 * 1000) {
    return 'weekly';
  }
  if (diff <= BIWEEK_IN_MS + 24 * 60 * 60 * 1000) {
    return 'biweekly';
  }
  return 'monthly';
}

export function normalizeLoan(raw: RawLoan): Loan {
  const installments = raw.installments.map((installment) => ({
    id: installment.id,
    sequence: installment.sequence,
    dueDate: new Date(installment.dueDate).toISOString(),
    amount: Number(toNumber(installment.amount).toFixed(2)),
    status: installment.status,
    paidAt: installment.paidAt ?? null,
  }));

  const frequency = raw.frequency ?? inferFrequency(installments);

  return {
    id: raw.id,
    borrowerName: raw.borrowerName,
    borrowerPhone: raw.borrowerPhone ?? undefined,
    borrowerDni: raw.borrowerDni ?? undefined,
    principal: Number(toNumber(raw.principal).toFixed(2)),
    interestRate: Number(toNumber(raw.interestRate).toFixed(2)),
    frequency,
    status: raw.status,
    issuedAt: new Date(raw.issuedAt).toISOString(),
    installments,
  };
}

export function normalizeLoans(raw: RawLoan[]): Loan[] {
  return raw.map(normalizeLoan);
}

export function normalizePayments(raw: RawPayment[]): Payment[] {
  return raw.map((payment) => ({
    id: payment.id,
    loanId: payment.loanId,
    installmentId: payment.installmentId ?? undefined,
    amount: Number(toNumber(payment.amount).toFixed(2)),
    paidAt: new Date(payment.paidAt).toISOString(),
    method: payment.method ?? undefined,
  }));
}

export function normalizeUsers(raw: RawUser[]): OrgUser[] {
  return raw.map((user) => ({
    id: user.id,
    email: user.email,
    role: (user.role as OrgUser['role']) ?? 'readonly',
  }));
}

export function normalizeSummary(raw: CashSummary): CashSummary {
  return {
    totalCollected: Number(toNumber(raw.totalCollected).toFixed(2)),
    pendingInstallments: raw.pendingInstallments,
    overdueInstallments: raw.overdueInstallments,
  };
}
