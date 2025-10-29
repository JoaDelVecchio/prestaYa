'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { GlassLoading } from '@/app/(protected)/components/glass-loading';

const STATUS_BADGE_CLASS = 'min-w-[96px] justify-center';
const FREQUENCY_LABEL: Record<Loan['frequency'], string> = {
  weekly: 'semanal',
  biweekly: 'quincenal',
  monthly: 'mensual',
};

type ChargePageClientProps = {
  initialLoans: Loan[];
};

export function ChargePageClient({ initialLoans }: ChargePageClientProps) {
  const searchParams = useSearchParams();
  const loanId = searchParams.get('loanId');
  const [loans, setLoans] = useState<Loan[]>(initialLoans);
  const [searchTerm, setSearchTerm] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const refreshLoans = useCallback(async () => {
    setIsLoading(true);
    try {
      const refreshed = await getLoans();
      setLoans(refreshed);
    } catch (_error) {
      // noop – surfaced elsewhere
    } finally {
      setIsLoading(false);
    }
  }, []);

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
      {isLoading ? (
        <GlassLoading
          size="compact"
          label="Actualizando cobros"
          helper="Refrescando los datos más recientes."
          className="max-w-xs self-end"
        />
      ) : null}
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

function LoanCard({
  loan,
  onRefresh,
  onFeedback,
  onShowDetails,
}: {
  loan: Loan;
  onRefresh: () => Promise<void>;
  onFeedback: (message: string) => void;
  onShowDetails: () => void;
}) {
  const action = useActionFeedback({
    defaultLabel: 'Cobrar cuota',
    successLabel: '¡Listo!',
    errorLabel: 'Reintentar',
  });

  const nextInstallment = loan.installments.find(
    (inst) => inst.status !== 'PAID',
  );

  const handleCharge = useCallback(async () => {
    if (!nextInstallment) return;
    action.start('Registrando cobro...');
    try {
      await chargeLoan({
        loanId: loan.id,
        installmentId: nextInstallment.id,
        amount: nextInstallment.amount,
      });
      action.success({
        message: 'Cobro registrado correctamente',
        celebrate: true,
      });
      onFeedback(
        `Se registró el cobro de la cuota ${nextInstallment.sequence} para ${loan.borrowerName}.`,
      );
      await onRefresh();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'No se pudo registrar el cobro';
      action.error(message);
    }
  }, [action, loan, nextInstallment, onFeedback, onRefresh]);

  const paidCount = loan.installments.filter(
    (inst) => inst.status === 'PAID',
  ).length;

  return (
    <div className="rounded-3xl border border-white/35 bg-white/65 px-6 py-6 shadow-subtle backdrop-blur-xl transition-all duration-[280ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-[2px] hover:border-white/50 hover:bg-white/80 hover:shadow-hover">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-lg font-semibold text-body-light">
              {loan.borrowerName}
            </p>
            <Badge variant="neutral" className="rounded-full px-3 py-1 text-xs">
              DNI {loan.borrowerDni || '—'}
            </Badge>
            <Badge variant="neutral" className="rounded-full px-3 py-1 text-xs">
              {FREQUENCY_LABEL[loan.frequency]}
            </Badge>
          </div>
          <div className="grid gap-2 text-sm text-body-light/70 md:grid-cols-2">
            <LoanInfoRow
              label="Préstamo"
              value={formatCurrency(loan.principal)}
            />
            <LoanInfoRow
              label="Interés"
              value={`${loan.interestRate}% ${FREQUENCY_LABEL[loan.frequency]}`}
            />
            <LoanInfoRow label="Emitido" value={formatDate(loan.issuedAt)} />
            <LoanInfoRow
              label="Cuotas pagas"
              value={`${paidCount} de ${loan.installments.length}`}
            />
          </div>
        </div>
        <div className="w-full space-y-4 rounded-2xl border border-white/30 bg-white/70 px-5 py-4 text-sm text-body-light shadow-subtle backdrop-blur-lg md:max-w-xs">
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-body-light/60">
            Próxima cuota
          </p>
          {nextInstallment ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
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
    <div className="rounded-2xl border border-white/20 bg-white/70 px-5 py-4 shadow-subtle backdrop-blur-lg transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-[2px] hover:border-white/35 hover:bg-white/80 hover:shadow-hover">
      <p className="text-xs font-medium uppercase tracking-[0.12em] text-body-light/60">
        {label}
      </p>
      <p className="text-2xl font-semibold text-body-light">{value}</p>
    </div>
  );
}

function LoanInstallmentRow({
  installment,
}: {
  installment: Loan['installments'][number];
}) {
  const statusVariant =
    installment.status === 'OVERDUE'
      ? 'danger'
      : installment.status === 'PAID'
        ? 'success'
        : 'warning';

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-white/20 bg-white/60 px-4 py-3 text-sm text-body-light shadow-subtle backdrop-blur-md transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-[1px] hover:border-white/35 hover:bg-white/75 hover:shadow-hover md:flex-row md:items-center md:justify-between">
      <div>
        <p className="font-semibold text-body-light">
          Cuota {installment.sequence}{' '}
          <span className="text-xs text-body-light/60">
            · Vence {formatDate(installment.dueDate)}
          </span>
        </p>
        {installment.paidAt ? (
          <p className="text-xs text-body-light/60">
            Pagada el {formatDate(installment.paidAt)}
          </p>
        ) : null}
      </div>
      <div className="flex items-center gap-3">
        <Badge
          variant={statusVariant}
          className="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em]"
        >
          {statusLabel(installment.status)}
        </Badge>
        <span className="text-base font-semibold text-body-light">
          {formatCurrency(installment.amount)}
        </span>
      </div>
    </div>
  );
}

function statusLabel(status: Loan['installments'][number]['status']) {
  switch (status) {
    case 'PAID':
      return 'Pagada';
    case 'OVERDUE':
      return 'En mora';
    default:
      return 'Pendiente';
  }
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

function getFrequencyLabel(frequency?: Loan['frequency']) {
  if (!frequency) return 'desconocida';
  return FREQUENCY_LABEL[frequency] ?? frequency;
}

function capitalizeFrequency(label: string) {
  return label.charAt(0).toUpperCase() + label.slice(1);
}
