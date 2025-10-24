import { mockDb, CreateLoanPayload, ChargePayload } from './mock-db';
import { CashSummary, Loan, OrgUser, Payment } from './types';

const isBrowser = typeof window !== 'undefined';

export async function getLoans(): Promise<Loan[]> {
  if (isBrowser) {
    const response = await fetch('/api/mock/loans', { cache: 'no-store' });
    return response.json();
  }
  return mockDb.listLoans();
}

export async function getLoan(id: string): Promise<Loan | undefined> {
  const loans = await getLoans();
  return loans.find((loan) => loan.id === id);
}

export async function createLoan(payload: CreateLoanPayload): Promise<Loan> {
  if (isBrowser) {
    const response = await fetch('/api/mock/loans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return response.json();
  }
  return mockDb.createLoan(payload);
}

export async function chargeLoan(payload: ChargePayload) {
  if (isBrowser) {
    const response = await fetch(`/api/mock/loans/${payload.loanId}/charge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        installmentId: payload.installmentId,
        amount: payload.amount,
        method: payload.method
      })
    });
    return response.json();
  }
  return mockDb.charge(payload);
}

export async function getCashSummary(): Promise<CashSummary> {
  if (isBrowser) {
    const response = await fetch('/api/mock/summary', { cache: 'no-store' });
    return response.json();
  }
  return mockDb.summary();
}

export async function getUsers(): Promise<OrgUser[]> {
  if (isBrowser) {
    const response = await fetch('/api/mock/users', { cache: 'no-store' });
    return response.json();
  }
  return mockDb.listUsers();
}

export async function getPayments(): Promise<Payment[]> {
  if (isBrowser) {
    const response = await fetch('/api/mock/payments', { cache: 'no-store' });
    return response.json();
  }
  return mockDb.listPayments();
}
