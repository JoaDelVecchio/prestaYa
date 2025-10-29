'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { chargeLoan, getLoans } from '@/lib/api';
import { Loan } from '@/lib/types';
import {
  ActionButton,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Badge,
} from '@prestaya/ui';
import { useActionFeedback } from '@/hooks/useActionFeedback';

export const dynamic = 'force-dynamic';

const STATUS_BADGE_CLASS = 'min-w-[96px] justify-center';
const FREQUENCY_LABEL: Record<Loan['frequency'], string> = {
  weekly: 'semanal',
  biweekly: 'quincenal',
  monthly: 'mensual',
};

function ChargePageContent() {
  const searchParams = useSearchParams();
  const loanId = searchParams.get('loanId');
  const [loans, setLoans] = useState<Loan[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);

  const refreshLoans = useCallback(async () => {
    const refreshed = await getLoans();
    setLoans(refreshed);
  }, []);

  useEffect(() => {
    refreshLoans();
  }, [refreshLoans]);

  useEffect(() => {
    if (!loanId) return;
    const match = loans.find((loan) => loan.id === loanId);
    if (match) {
      setSearchTerm((match.borrowerDni ?? '').replace(/\D/g, ''));
    }
  }, [loanId, loans]);

  const filteredLoans = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return loans.filter((loan) => {
      const hasPending = loan.installments.some(
        (inst) => inst.status !== 'PAID',
      );
      if (!hasPending) {
        return false;
      }
      if (!term) {
        return true;
      }
      const dni = (loan.borrowerDni ?? '').toLowerCase();
      return dni.includes(term);
    });
  }, [loans, searchTerm]);

  const summary = useMemo(() => {
    const activeLoans = loans.filter((loan) =>
      loan.installments.some((inst) => inst.status !== 'PAID'),
    );
    const overdueLoans = loans.filter((loan) =>
      loan.installments.some((inst) => inst.status === 'OVERDUE'),
    );
    const pendingInstallments = loans.reduce(
      (total, loan) =>
        total +
        loan.installments.filter((inst) => inst.status !== 'PAID').length,
      0,
    );
    const totalDue = loans.reduce(
      (total, loan) =>
        total +
        loan.installments
          .filter((inst) => inst.status !== 'PAID')
          .reduce((sum, inst) => sum + inst.amount, 0),
      0,
    );

    return {
      totalLoans: loans.length,
      activeLoans: activeLoans.length,
      overdueLoans: overdueLoans.length,
      pendingInstallments,
      totalDue,
    };
  }, [loans]);

  const selectedLoan = useMemo(
    () => loans.find((loan) => loan.id === selectedLoanId) ?? null,
    [loans, selectedLoanId],
  );

  return (
    <div className="flex flex-col gap-6">
      <Card className="transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-[2px] hover:shadow-hover">
        <CardHeader>
          <CardTitle>Resumen de cobranza</CardTitle>
          <p className="text-sm text-body-light/60">
            Monitoreá el estado de tus cobros y cuotas pendientes.
          </p>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <SummaryMetric
            label="Préstamos activos"
            value={summary.activeLoans}
          />
          <SummaryMetric
            label="Préstamos con mora"
            value={summary.overdueLoans}
          />
          <SummaryMetric
            label="Cuotas pendientes"
            value={summary.pendingInstallments}
          />
          <SummaryMetric
            label="Total adeudado"
            value={formatCurrency(summary.totalDue)}
          />
        </CardContent>
      </Card>

      <Card className="transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-[2px] hover:shadow-hover">
        <CardHeader className="space-y-2">
          <CardTitle>Gestionar cobros</CardTitle>
          <p className="text-sm text-body-light/60">
            Seleccioná un préstamo para registrar la próxima cuota.
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <Label htmlFor="loan-search">Buscar préstamo</Label>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
              <div className="relative inline-flex w-full max-w-md items-center">
                <Input
                  id="loan-search"
                  placeholder="Buscar por DNI"
                  value={searchTerm}
                  onChange={(event) =>
                    setSearchTerm(event.target.value.replace(/\D/g, ''))
                  }
                  className="pl-12 pr-4"
                />
                <span className="pointer-events-none absolute left-5 text-body-light/40">
                  🔍
                </span>
              </div>
              {feedbackMessage && (
                <p className="text-sm text-body-light/70">{feedbackMessage}</p>
              )}
            </div>
          </div>

          <div className="space-y-5">
            {filteredLoans.map((loan) => (
              <LoanCard
                key={loan.id}
                loan={loan}
                onRefresh={refreshLoans}
                onFeedback={setFeedbackMessage}
                onShowDetails={() => setSelectedLoanId(loan.id)}
              />
            ))}
            {filteredLoans.length === 0 && (
              <p className="text-sm text-body-light/70">
                No se encontraron préstamos con ese criterio.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
      <LoanDetailsModal
        loan={selectedLoan}
        onClose={() => setSelectedLoanId(null)}
      />
    </div>
  );
}

export default function ChargePage() {
  return (
    <Suspense fallback={<div>Cargando cobros...</div>}>
      <ChargePageContent />
    </Suspense>
  );
}

interface LoanCardProps {
  loan: Loan;
  onRefresh: () => Promise<void>;
  onFeedback: (message: string) => void;
  onShowDetails: () => void;
}

function LoanCard({
  loan,
  onRefresh,
  onFeedback,
  onShowDetails,
}: LoanCardProps) {
  const action = useActionFeedback({
    defaultLabel: 'Cobrar cuota',
    successLabel: '¡Listo!',
    errorLabel: 'Reintentar',
  });

  const nextInstallment = useMemo(
    () => loan.installments.find((inst) => inst.status !== 'PAID'),
    [loan],
  );

  const pendingInstallments = useMemo(
    () => loan.installments.filter((inst) => inst.status !== 'PAID'),
    [loan],
  );
  const overdueCount = useMemo(
    () => loan.installments.filter((inst) => inst.status === 'OVERDUE').length,
    [loan],
  );
  const paidCount = useMemo(
    () => loan.installments.filter((inst) => inst.status === 'PAID').length,
    [loan],
  );
  const pendingCount = pendingInstallments.length;
  const pendingAmount = pendingInstallments.reduce(
    (sum, inst) => sum + inst.amount,
    0,
  );

  const statusBadge: {
    variant: 'danger' | 'warning' | 'success';
    label: string;
  } =
    overdueCount > 0
      ? { variant: 'danger', label: 'En mora' }
      : pendingCount > 0
        ? { variant: 'warning', label: 'Pendiente' }
        : { variant: 'success', label: 'Al día' };

  const handleCharge = useCallback(async () => {
    if (!nextInstallment) {
      action.error('Sin cuotas pendientes');
      onFeedback('No hay cuotas pendientes para este préstamo');
      return;
    }

    action.start('Registrando cobro...');
    try {
      await chargeLoan({
        loanId: loan.id,
        installmentId: nextInstallment.id,
        amount: nextInstallment.amount,
      });
      await onRefresh();
      action.success({ message: 'Cobro registrado' });
      onFeedback(`Cobro registrado para ${loan.borrowerName}`);
    } catch (error) {
      action.error('No se pudo registrar el cobro');
      onFeedback('No se pudo registrar el cobro.');
    }
  }, [action, loan, nextInstallment, onFeedback, onRefresh]);

  return (
    <div className="space-y-5 rounded-2xl border border-white/25 bg-white/65 px-6 py-5 shadow-subtle backdrop-blur-lg transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-[2px] hover:border-white/40 hover:bg-white/80 hover:shadow-hover">
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-lg font-semibold text-body-light">
              {loan.borrowerName}
            </p>
            <Badge
              variant={statusBadge.variant}
              className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] ${STATUS_BADGE_CLASS}`}
            >
              {statusBadge.label}
            </Badge>
          </div>
          <div className="flex flex-wrap gap-2 text-[11px] font-medium uppercase tracking-[0.12em] text-body-light/60">
            <span>DNI {loan.borrowerDni || '—'}</span>
            <span>Tel {loan.borrowerPhone || '—'}</span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <LoanInfoRow
              label="Principal"
              value={formatCurrency(loan.principal)}
            />
            <LoanInfoRow
              label="Tasa"
              value={`${loan.interestRate}% ${getFrequencyLabel(loan.frequency)}`}
            />
            <LoanInfoRow
              label="Total pendiente"
              value={formatCurrency(pendingAmount)}
            />
            <LoanInfoRow label="Emitido" value={formatDate(loan.issuedAt)} />
          </div>
        </div>

        <div className="flex w-full flex-col gap-3 md:max-w-sm">
          <div className="rounded-xl border border-white/30 bg-white/75 px-4 py-4 shadow-subtle backdrop-blur-md">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-body-light/60">
              Próxima cuota
            </p>
            {nextInstallment ? (
              <div className="mt-3 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-body-light">
                      Cuota {nextInstallment.sequence} /{' '}
                      {loan.installments.length}
                    </p>
                    <p className="text-xs text-body-light/60">
                      Vence {formatDate(nextInstallment.dueDate)}
                    </p>
                  </div>
                  <Badge
                    variant={
                      nextInstallment.status === 'OVERDUE'
                        ? 'danger'
                        : nextInstallment.status === 'PAID'
                          ? 'success'
                          : 'warning'
                    }
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] ${STATUS_BADGE_CLASS}`}
                  >
                    {statusLabel(nextInstallment.status)}
                  </Badge>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-white/30 bg-white/70 px-4 py-2">
                  <span className="text-xs font-medium uppercase tracking-[0.12em] text-body-light/60">
                    Importe
                  </span>
                  <span className="text-lg font-semibold text-body-light">
                    {formatCurrency(nextInstallment.amount)}
                  </span>
                </div>
              </div>
            ) : (
              <p className="mt-3 text-sm text-body-light/70">
                Todas las cuotas están pagas 🎉
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={onShowDetails}
                className="inline-flex items-center rounded-full border border-white/40 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-body-light transition-all duration-200 hover:scale-[1.03] hover:shadow-subtle"
              >
                Ver detalles
              </button>
              <ActionButton
                status={action.status}
                label={
                  nextInstallment
                    ? action.status === 'idle'
                      ? `Cobrar cuota ${nextInstallment.sequence}`
                      : action.label
                    : 'Sin cuotas pendientes'
                }
                showSpinner={action.visual.spinner}
                showCheck={action.visual.check}
                showError={action.visual.error}
                showProgress={action.visual.progress}
                flash={action.visual.flash}
                shake={action.visual.shake}
                celebrate={action.visual.celebrate}
                disabled={!nextInstallment || action.status === 'running'}
                onClick={handleCharge}
              />
            </div>
            {action.message && (
              <p className="text-xs text-body-light/70">{action.message}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryMetric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-white/20 bg-white/70 px-5 py-4 shadow-subtle backdrop-blur-lg transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-[2px] hover:border-white/35 hover:bg-white/80 hover:shadow-hover">
      <p className="text-xs font-medium uppercase tracking-[0.12em] text-body-light/60">
        {label}
      </p>
      <p className="text-2xl font-semibold text-body-light">{value}</p>
    </div>
  );
}

function LoanInfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-white/30 bg-white/75 px-4 py-3 text-sm text-body-light">
      <span className="text-xs font-medium uppercase tracking-[0.12em] text-body-light/60">
        {label}
      </span>
      <span className="text-sm font-semibold text-body-light">{value}</span>
    </div>
  );
}

function LoanDetailsModal({
  loan,
  onClose,
}: {
  loan: Loan | null;
  onClose: () => void;
}) {
  const close = useCallback(() => {
    onClose();
  }, [onClose]);

  if (!loan) return null;

  const paidCount = loan.installments.filter(
    (inst) => inst.status === 'PAID',
  ).length;
  const overdueCount = loan.installments.filter(
    (inst) => inst.status === 'OVERDUE',
  ).length;
  const pendingCount = loan.installments.length - paidCount - overdueCount;
  const totalPlanned = loan.installments.reduce(
    (sum, inst) => sum + inst.amount,
    0,
  );
  const totalPaid = loan.installments
    .filter((inst) => inst.status === 'PAID')
    .reduce((sum, inst) => sum + inst.amount, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 py-8 backdrop-blur-sm">
      <Card className="flex max-h-[80vh] w-full max-w-xl flex-col overflow-hidden shadow-pop transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]">
        <CardHeader className="flex-shrink-0 space-y-3 border-b border-white/20 pb-4">
          <CardTitle>Detalle del préstamo</CardTitle>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-body-light/70">
            <span>{loan.borrowerName}</span>
            <span>DNI: {loan.borrowerDni || '—'}</span>
            <span>Tel: {loan.borrowerPhone || '—'}</span>
            <span>Emitido: {formatDate(loan.issuedAt)}</span>
          </div>
        </CardHeader>
        <CardContent className="flex-1 space-y-6 overflow-y-auto pt-6 pr-1">
          <div className="grid gap-3 md:grid-cols-2">
            <ModalMetric
              label="Principal"
              value={formatCurrency(loan.principal)}
            />
            <ModalMetric
              label="Total planificado"
              value={formatCurrency(totalPlanned)}
            />
            <ModalMetric
              label="Total cobrado"
              value={formatCurrency(totalPaid)}
            />
            <ModalMetric
              label="Cuotas pagas"
              value={`${paidCount} de ${loan.installments.length}`}
            />
            <ModalMetric
              label="Cuotas en mora"
              value={overdueCount.toString()}
            />
            <ModalMetric label="Emitido" value={formatDate(loan.issuedAt)} />
            <ModalMetric
              label="Frecuencia"
              value={capitalizeFrequency(getFrequencyLabel(loan.frequency))}
            />
          </div>
          <div className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-body-light/60">
              Plan de cuotas
            </p>
            <div className="space-y-2">
              {loan.installments.map((installment) => (
                <LoanInstallmentRow
                  key={installment.id ?? `${loan.id}-${installment.sequence}`}
                  installment={installment}
                />
              ))}
            </div>
          </div>
        </CardContent>
        <div className="flex flex-shrink-0 justify-end border-t border-white/20 px-6 py-4">
          <ActionButton
            status="idle"
            label="Cerrar"
            onClick={close}
            showSpinner={false}
            showCheck={false}
            showError={false}
            showProgress={false}
            flash={false}
            shake={false}
            celebrate={false}
          />
        </div>
      </Card>
    </div>
  );
}

function ModalMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/25 bg-white/70 px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-[0.12em] text-body-light/60">
        {label}
      </p>
      <p className="text-sm font-semibold text-body-light">{value}</p>
    </div>
  );
}

function LoanInstallmentRow({
  installment,
}: {
  installment: Loan['installments'][number];
}) {
  const badgeVariant =
    installment.status === 'PAID'
      ? 'success'
      : installment.status === 'OVERDUE'
        ? 'danger'
        : 'warning';
  return (
    <div className="grid gap-3 rounded-xl border border-white/25 bg-white/70 px-4 py-3 text-sm text-body-light md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_auto] md:items-center">
      <div className="space-y-1">
        <p className="font-semibold text-body-light">
          Cuota {installment.sequence}
        </p>
        <p className="text-xs text-body-light/60">
          Vence {formatDate(installment.dueDate)}
        </p>
        {installment.paidAt ? (
          <p className="text-xs text-body-light/60">
            Pagada el {formatDate(installment.paidAt)}
          </p>
        ) : (
          <p className="text-xs text-body-light/60">
            {installment.status === 'OVERDUE' ? 'En mora' : 'Pendiente de pago'}
          </p>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={badgeVariant} className={STATUS_BADGE_CLASS}>
          {statusLabel(installment.status)}
        </Badge>
      </div>
      <div className="text-right font-semibold text-body-light tabular-nums min-w-[100px]">
        {formatCurrency(installment.amount)}
      </div>
    </div>
  );
}

function statusLabel(status: string) {
  switch (status) {
    case 'OVERDUE':
      return 'En mora';
    case 'PAID':
      return 'Pagada';
    default:
      return 'Pendiente';
  }
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

const currencyFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatCurrency(amount: number) {
  return currencyFormatter.format(amount);
}

function capitalizeFrequency(label: string) {
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function getFrequencyLabel(frequency?: Loan['frequency']) {
  if (!frequency || !FREQUENCY_LABEL[frequency]) {
    return FREQUENCY_LABEL.weekly;
  }
  return FREQUENCY_LABEL[frequency];
}
