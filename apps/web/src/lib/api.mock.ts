import type { CashSummary, Loan, OrgUser, Payment } from './types';
import type { ChargeLoanInput, CreateLoanInput } from './api.types';
import { mockDb } from './mock-db';

export async function getLoansMock(): Promise<Loan[]> {
  return mockDb.listLoans();
}

export async function getCashSummaryMock(): Promise<CashSummary> {
  return mockDb.summary();
}

export async function getPaymentsMock(): Promise<Payment[]> {
  return mockDb.listPayments();
}

export async function getUsersMock(): Promise<OrgUser[]> {
  return mockDb.listUsers();
}

export async function createLoanMock(payload: CreateLoanInput): Promise<Loan> {
  return mockDb.createLoan(payload);
}

export async function chargeLoanMock(
  payload: ChargeLoanInput,
): Promise<unknown> {
  return mockDb.charge(payload);
}
