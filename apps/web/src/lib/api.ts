import type { CashSummary, Loan, OrgUser, Payment } from './types';
import type { ChargeLoanInput, CreateLoanInput } from './api.types';

const useRealApi = process.env.NEXT_PUBLIC_USE_REAL_API === 'true';

export type { CreateLoanInput, ChargeLoanInput } from './api.types';

async function loadMockModule() {
  return import('./api.mock');
}

export async function getLoans(): Promise<Loan[]> {
  if (!useRealApi) {
    const { getLoansMock } = await loadMockModule();
    return getLoansMock();
  }
  if (typeof window === 'undefined') {
    const { getLoansServer } = await import('./api.server');
    return getLoansServer();
  }
  const { getLoansClient } = await import('./api.client');
  return getLoansClient();
}

export async function getCashSummary(): Promise<CashSummary> {
  if (!useRealApi) {
    const { getCashSummaryMock } = await loadMockModule();
    return getCashSummaryMock();
  }
  if (typeof window === 'undefined') {
    const { getCashSummaryServer } = await import('./api.server');
    return getCashSummaryServer();
  }
  const { getCashSummaryClient } = await import('./api.client');
  return getCashSummaryClient();
}

export async function getPayments(): Promise<Payment[]> {
  if (!useRealApi) {
    const { getPaymentsMock } = await loadMockModule();
    return getPaymentsMock();
  }
  if (typeof window === 'undefined') {
    const { getPaymentsServer } = await import('./api.server');
    return getPaymentsServer();
  }
  const { getPaymentsClient } = await import('./api.client');
  return getPaymentsClient();
}

export async function getUsers(): Promise<OrgUser[]> {
  if (!useRealApi) {
    const { getUsersMock } = await loadMockModule();
    return getUsersMock();
  }
  if (typeof window === 'undefined') {
    const { getUsersServer } = await import('./api.server');
    return getUsersServer();
  }
  const { getUsersClient } = await import('./api.client');
  return getUsersClient();
}

export async function createLoan(payload: CreateLoanInput): Promise<Loan> {
  if (!useRealApi) {
    const { createLoanMock } = await loadMockModule();
    return createLoanMock(payload);
  }
  if (typeof window === 'undefined') {
    const { createLoanServer } = await import('./api.server');
    return createLoanServer(payload);
  }
  const { createLoanClient } = await import('./api.client');
  return createLoanClient(payload);
}

export async function chargeLoan(payload: ChargeLoanInput) {
  if (!useRealApi) {
    const { chargeLoanMock } = await loadMockModule();
    return chargeLoanMock(payload);
  }
  if (typeof window === 'undefined') {
    const { chargeLoanServer } = await import('./api.server');
    return chargeLoanServer(payload);
  }
  const { chargeLoanClient } = await import('./api.client');
  return chargeLoanClient(payload);
}
