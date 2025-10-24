export type LoanStatus = 'PENDING' | 'REMINDED' | 'OVERDUE' | 'PAID';

export type InstallmentStatus = 'PENDING' | 'PAID' | 'OVERDUE';

export type Installment = {
  id: string;
  sequence: number;
  dueDate: string;
  amount: number;
  status: InstallmentStatus;
  paidAt?: string | null;
};

export type Loan = {
  id: string;
  borrowerName: string;
  borrowerPhone?: string;
  borrowerDni?: string;
  principal: number;
  interestRate: number;
  frequency: 'weekly' | 'biweekly' | 'monthly';
  status: LoanStatus;
  issuedAt: string;
  installments: Installment[];
};

export type Payment = {
  id: string;
  loanId: string;
  installmentId?: string;
  amount: number;
  paidAt: string;
};

export type CashSummary = {
  totalCollected: number;
  pendingInstallments: number;
  overdueInstallments: number;
};

export type OrgUser = {
  id: string;
  email: string;
  role: 'owner' | 'supervisor' | 'caja' | 'readonly';
};
