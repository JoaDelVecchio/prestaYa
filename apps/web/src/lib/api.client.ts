import type { CashSummary, Loan, OrgUser, Payment } from './types';
import type { ChargeLoanInput, CreateLoanInput } from './api.types';
import {
  normalizeLoans,
  normalizePayments,
  normalizeSummary,
  normalizeUsers,
  type RawLoan,
  type RawPayment,
  type RawUser,
} from './api.helpers';

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3131/api'
).replace(/\/$/, '');

function readAuthToken(): string | undefined {
  const match = document.cookie.match(/(?:^|;\s*)sb-access-token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : undefined;
}

function decodeToken(token: string): { orgId?: string; role?: string } {
  try {
    const [, payload] = token.split('.');
    if (!payload) return {};
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      '=',
    );
    const decoded = JSON.parse(atob(padded));
    return {
      orgId:
        decoded.org_id ??
        decoded.orgId ??
        decoded.user_metadata?.default_org_id,
      role: decoded.role ?? decoded.app_metadata?.roles?.[0],
    };
  } catch {
    return {};
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers ?? {});
  headers.set('Accept', 'application/json');

  const token = readAuthToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
    const { orgId, role } = decodeToken(token);
    if (orgId && !headers.has('x-org-id')) {
      headers.set('x-org-id', orgId);
    }
    if (role && !headers.has('x-user-role')) {
      headers.set('x-user-role', role);
    }
  }

  if (init?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
    credentials: 'include',
    cache: 'no-store',
  });

  if (!response.ok) {
    const message = await extractError(response);
    throw new Error(message);
  }

  return (await response.json()) as T;
}

async function extractError(response: Response) {
  try {
    const data = await response.json();
    if (typeof data?.message === 'string') return data.message;
    if (Array.isArray(data?.message)) return data.message.join(', ');
    return response.statusText || 'Unknown error';
  } catch {
    return response.statusText || 'Unknown error';
  }
}

export async function getLoansClient(): Promise<Loan[]> {
  const data = await request<RawLoan[]>('/loans');
  return normalizeLoans(data);
}

export async function getCashSummaryClient(): Promise<CashSummary> {
  const data = await request<CashSummary>('/summary');
  return normalizeSummary(data);
}

export async function getPaymentsClient(): Promise<Payment[]> {
  const data = await request<RawPayment[]>('/payments');
  return normalizePayments(data);
}

export async function getUsersClient(): Promise<OrgUser[]> {
  const data = await request<RawUser[]>('/users');
  return normalizeUsers(data);
}

export async function createLoanClient(
  payload: CreateLoanInput,
): Promise<Loan> {
  const data = await request<RawLoan>('/loans', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return normalizeLoans([data])[0]!;
}

export async function chargeLoanClient(
  payload: ChargeLoanInput,
): Promise<unknown> {
  const body = {
    installmentId: payload.installmentId,
    amount: payload.amount,
    method: payload.method ?? 'cash',
  };

  return request(`/loans/${payload.loanId}/charge`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
