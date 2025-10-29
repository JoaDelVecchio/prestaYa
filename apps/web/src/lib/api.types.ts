import type { CashSummary, Loan, OrgUser, Payment } from './types';

export type CreateLoanInput = {
  borrowerName: string;
  borrowerPhone?: string;
  borrowerDni: string;
  principal: number;
  interestRate: number;
  numberOfInstallments: number;
  frequency: Loan['frequency'];
  firstDueDate: string;
};

export type ChargeLoanInput = {
  loanId: string;
  installmentId?: string;
  amount: number;
  method?: string;
};

export type ApiContract = {
  getLoans(): Promise<Loan[]>;
  getCashSummary(): Promise<CashSummary>;
  getPayments(): Promise<Payment[]>;
  getUsers(): Promise<OrgUser[]>;
  createLoan(payload: CreateLoanInput): Promise<Loan>;
  chargeLoan(payload: ChargeLoanInput): Promise<unknown>;
};
