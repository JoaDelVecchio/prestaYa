import {
  getCashSummaryServer,
  getLoansServer,
  getPaymentsServer,
} from '@/lib/api.server';
import type { Loan, Payment } from '@/lib/types';
import { ArqueoPageClient, type Operation } from './arqueo-client';

export const revalidate = 0;

export default async function ArqueoPage() {
  const [summary, payments, loans] = await Promise.all([
    getCashSummaryServer(),
    getPaymentsServer(),
    getLoansServer(),
  ]);

  const operations = buildOperations(loans, payments);

  return <ArqueoPageClient summary={summary} operations={operations} />;
}

function buildOperations(loans: Loan[], payments: Payment[]): Operation[] {
  const paymentByInstallment = new Map(
    payments.map((payment) => [payment.installmentId ?? '', payment]),
  );

  return loans.flatMap((loan) =>
    loan.installments.map<Operation>((installment) => {
      const payment = paymentByInstallment.get(installment.id ?? '') ?? null;
      const status = payment
        ? 'PAID'
        : installment.status === 'OVERDUE'
          ? 'OVERDUE'
          : 'PENDING';

      return {
        id: installment.id ?? `${loan.id}-${installment.sequence}`,
        loanId: loan.id,
        borrowerName: loan.borrowerName,
        borrowerDni: loan.borrowerDni,
        borrowerPhone: loan.borrowerPhone,
        status,
        amount: installment.amount,
        dueDate: installment.dueDate,
        paidAt: payment?.paidAt,
        method: payment?.method,
        sequence: installment.sequence,
      };
    }),
  );
}
