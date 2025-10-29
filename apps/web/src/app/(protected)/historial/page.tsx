'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { getCashSummary, getPayments, getLoans } from '@/lib/api';
import { Loan } from '@/lib/types';
import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  ActionButton,
} from '@prestaya/ui';
import clsx from 'clsx';

export const dynamic = 'force-dynamic';

const STATUS_BADGE_CLASS = 'min-w-[96px] justify-center';
const FREQUENCY_LABEL: Record<Loan['frequency'], string> = {
  weekly: 'semanal',
  biweekly: 'quincenal',
  monthly: 'mensual',
};

type OperationStatus = 'PENDING' | 'OVERDUE' | 'PAID';

type Operation = {
  id: string;
  loanId: string;
  borrowerName: string;
  borrowerDni?: string;
  borrowerPhone?: string;
  status: OperationStatus;
  amount: number;
  dueDate: string;
  paidAt?: string;
  method?: string | null;
  sequence: number;
  issuedAt: string;
  frequency: Loan['frequency'];
};

type OperationGroup = {
  loanId: string;
  borrowerName: string;
  borrowerDni?: string;
  borrowerPhone?: string;
  issuedAt: string;
  frequency: Loan['frequency'];
  operations: Operation[];
};

const STATUS_FILTERS: { label: string; value: OperationStatus | 'ALL' }[] = [
  { label: 'Todos', value: 'ALL' },
  { label: 'Pendientes', value: 'PENDING' },
  { label: 'En mora', value: 'OVERDUE' },
  { label: 'Pagados', value: 'PAID' },
];

function buildOperations(
  loans: Awaited<ReturnType<typeof getLoans>>,
  payments: Awaited<ReturnType<typeof getPayments>>,
) {
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
        issuedAt: loan.issuedAt,
        frequency: loan.frequency,
      };
    }),
  );
}

export default function HistorialPage() {
  const [summary, setSummary] = useState({
    totalCollected: 0,
    pendingInstallments: 0,
    overdueInstallments: 0,
  });
  const [operations, setOperations] = useState<Operation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | OperationStatus>(
    'ALL',
  );
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const [summaryData, payments, loans] = await Promise.all([
        getCashSummary(),
        getPayments(),
        getLoans(),
      ]);
      setSummary(summaryData);
      setOperations(buildOperations(loans, payments));
    }
    load();
  }, []);

  const allGroups = useMemo<OperationGroup[]>(() => {
    const byLoan = new Map<string, OperationGroup>();

    operations.forEach((operation) => {
      const existing = byLoan.get(operation.loanId);
      if (existing) {
        existing.operations.push(operation);
        return;
      }
      byLoan.set(operation.loanId, {
        loanId: operation.loanId,
        borrowerName: operation.borrowerName,
        borrowerDni: operation.borrowerDni,
        borrowerPhone: operation.borrowerPhone,
        issuedAt: operation.issuedAt,
        frequency: operation.frequency,
        operations: [operation],
      });
    });

    return Array.from(byLoan.values())
      .map((group) => ({
        ...group,
        operations: [...group.operations].sort(
          (a, b) => a.sequence - b.sequence,
        ),
      }))
      .sort((a, b) =>
        a.borrowerName.localeCompare(b.borrowerName, 'es', {
          sensitivity: 'base',
        }),
      );
  }, [operations]);

  const filteredGroups = useMemo<OperationGroup[]>(() => {
    const term = searchTerm.trim().toLowerCase();

    return allGroups
      .map((group) => {
        const operationsByStatus =
          statusFilter === 'ALL'
            ? group.operations
            : group.operations.filter(
                (operation) => operation.status === statusFilter,
              );

        if (operationsByStatus.length === 0) {
          return null;
        }

        if (term) {
          const dni = (group.borrowerDni ?? '').toLowerCase();
          if (!dni.includes(term)) {
            return null;
          }
        }

        return {
          ...group,
          operations: operationsByStatus,
        };
      })
      .filter((group): group is OperationGroup => group !== null);
  }, [allGroups, statusFilter, searchTerm]);

  const selectedGroup = useMemo<OperationGroup | null>(() => {
    if (!selectedLoanId) {
      return null;
    }
    return allGroups.find((group) => group.loanId === selectedLoanId) ?? null;
  }, [allGroups, selectedLoanId]);

  return (
    <div className="flex flex-col gap-6">
      <Card className="transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-[2px] hover:shadow-hover">
        <CardHeader>
          <CardTitle>Historial diario</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <SummaryMetric
            label="Total cobrado"
            value={formatCurrency(summary.totalCollected)}
          />
          <SummaryMetric
            label="Cuotas pendientes"
            value={summary.pendingInstallments}
          />
          <SummaryMetric
            label="Cuotas en mora"
            value={summary.overdueInstallments}
          />
        </CardContent>
      </Card>

      <Card className="transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-[2px] hover:shadow-hover">
        <CardHeader className="space-y-2">
          <CardTitle>Historial de transacciones</CardTitle>
          <p className="text-sm text-body-light/60">
            Consultá todos los movimientos del sistema.
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <Label htmlFor="operation-search">Buscar operaciones</Label>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
              <div className="relative inline-flex w-full max-w-md items-center">
                <Input
                  id="operation-search"
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
              <div className="sm:ml-2 sm:flex-1 sm:max-w-lg">
                <StatusFilter
                  filter={statusFilter}
                  onChange={setStatusFilter}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {filteredGroups.map((group) => (
              <LoanGroupCard
                key={group.loanId}
                group={group}
                onDetails={() => setSelectedLoanId(group.loanId)}
              />
            ))}
            {filteredGroups.length === 0 && (
              <p className="text-sm text-body-light/70">
                No encontramos operaciones con ese filtro.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <LoanDetailsModal
        group={selectedGroup}
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

function StatusFilter({
  filter,
  onChange,
}: {
  filter: 'ALL' | OperationStatus;
  onChange: (value: 'ALL' | OperationStatus) => void;
}) {
  const activeIndex = Math.max(
    0,
    STATUS_FILTERS.findIndex((option) => option.value === filter),
  );

  return (
    <div className="relative inline-flex w-full items-center overflow-hidden rounded-full border border-white/35 bg-white/35 px-2 py-1.5 shadow-subtle backdrop-blur-xl sm:max-w-xl">
      <span
        className="pointer-events-none absolute inset-y-1 left-1 rounded-full bg-accent/90 shadow-hover transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{
          width: `${100 / STATUS_FILTERS.length}%`,
          transform: `translateX(${activeIndex * 100}%)`,
        }}
      />
      {STATUS_FILTERS.map((option) => {
        const isActive = option.value === filter;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={clsx(
              'relative z-10 flex-1 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 whitespace-nowrap',
              isActive
                ? 'text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.25)]'
                : 'text-body-light/65 hover:text-body-light',
            )}
            aria-pressed={isActive}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function LoanGroupCard({
  group,
  onDetails,
}: {
  group: OperationGroup;
  onDetails: () => void;
}) {
  const paidCount = group.operations.filter(
    (operation) => operation.status === 'PAID',
  ).length;
  const overdueCount = group.operations.filter(
    (operation) => operation.status === 'OVERDUE',
  ).length;
  const pendingCount = group.operations.length - paidCount - overdueCount;
  const previewOperations = group.operations.slice(
    0,
    Math.min(group.operations.length, 3),
  );
  const statusChips: Array<{
    label: string;
    variant: 'warning' | 'danger' | 'success';
  }> = [];
  if (pendingCount === 0 && overdueCount === 0) {
    statusChips.push({ label: 'Completado', variant: 'success' });
  } else {
    if (pendingCount > 0) {
      statusChips.push({
        label: `Pendientes ${pendingCount}`,
        variant: 'warning',
      });
    }
    if (overdueCount > 0) {
      statusChips.push({ label: `En mora ${overdueCount}`, variant: 'danger' });
    }
    if (paidCount > 0) {
      statusChips.push({ label: `Pagadas ${paidCount}`, variant: 'success' });
    }
  }

  return (
    <div className="space-y-4 rounded-xl border border-white/25 bg-white/65 px-6 py-5 shadow-subtle backdrop-blur-lg transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-[2px] hover:border-white/40 hover:bg-white/80 hover:shadow-hover">
      <div className="flex flex-col gap-3 transition-all duration-300 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-body-light">
            <p className="text-base font-semibold">{group.borrowerName}</p>
            {statusChips.length > 0 && (
              <div className="flex flex-wrap items-center gap-1">
                {statusChips.map((chip) => (
                  <Badge
                    key={chip.label}
                    variant={chip.variant}
                    className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em]"
                  >
                    {chip.label}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-body-light/60">
            <span>DNI: {group.borrowerDni || '—'}</span>
            <span>Tel: {group.borrowerPhone || '—'}</span>
            <span>
              Emitido:{' '}
              {formatDate(group.operations[0]?.issuedAt ?? group.issuedAt)}
            </span>
          </div>
        </div>
        <div className="flex justify-start md:justify-end">
          <ActionButton
            status="idle"
            label="Ver detalles"
            onClick={onDetails}
            showSpinner={false}
            showCheck={false}
            showError={false}
            showProgress={false}
            flash={false}
            shake={false}
            celebrate={false}
          />
        </div>
      </div>
      <div className="space-y-2">
        {previewOperations.map((operation) => (
          <LoanOperationPreview
            key={`${operation.loanId}-${operation.sequence}`}
            operation={operation}
          />
        ))}
        {group.operations.length > previewOperations.length && (
          <button
            type="button"
            onClick={onDetails}
            className="w-fit self-start text-left text-sm font-medium text-accent transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-[1.02] hover:text-accent/80"
          >
            Ver las {group.operations.length} cuotas
          </button>
        )}
      </div>
    </div>
  );
}

function LoanOperationPreview({ operation }: { operation: Operation }) {
  const badgeVariant =
    operation.status === 'PAID'
      ? 'success'
      : operation.status === 'OVERDUE'
        ? 'danger'
        : 'warning';
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-white/20 bg-white/75 px-4 py-3 text-sm text-body-light transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-[1px] hover:border-white/35 hover:bg-white/85 hover:shadow-subtle md:flex-row md:items-center md:justify-between md:gap-6">
      <div className="space-y-1 md:flex-1">
        <p className="font-medium text-body-light">
          Cuota {operation.sequence}
        </p>
        <p className="text-xs text-body-light/60">
          Vence {formatDate(operation.dueDate)}
        </p>
        {operation.paidAt && (
          <p className="text-xs text-body-light/60">
            Pagada el {formatDate(operation.paidAt)}
          </p>
        )}
      </div>
      <div className="flex items-center justify-end gap-3 md:min-w-[150px]">
        <Badge variant={badgeVariant} className={STATUS_BADGE_CLASS}>
          {statusLabel(operation.status)}
        </Badge>
        <span className="font-semibold text-body-light tabular-nums min-w-[90px] text-right">
          {formatCurrency(operation.amount)}
        </span>
      </div>
    </div>
  );
}

function LoanDetailsModal({
  group,
  onClose,
}: {
  group: OperationGroup | null;
  onClose: () => void;
}) {
  const close = useCallback(() => {
    onClose();
  }, [onClose]);

  if (!group) return null;

  const paidCount = group.operations.filter(
    (operation) => operation.status === 'PAID',
  ).length;
  const overdueCount = group.operations.filter(
    (operation) => operation.status === 'OVERDUE',
  ).length;
  const pendingCount = group.operations.length - paidCount - overdueCount;
  const totalAmount = group.operations.reduce(
    (sum, operation) => sum + operation.amount,
    0,
  );
  const paidAmount = group.operations
    .filter((operation) => operation.status === 'PAID')
    .reduce((sum, operation) => sum + operation.amount, 0);
  const frequencyLabel = capitalizeFrequency(
    getFrequencyLabel(group.frequency),
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 py-8 backdrop-blur-sm">
      <Card className="flex max-h-[80vh] w-full max-w-xl flex-col overflow-hidden shadow-pop transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]">
        <CardHeader className="flex-shrink-0 space-y-3 border-b border-white/20 pb-4">
          <CardTitle>Detalle del préstamo</CardTitle>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-body-light/70">
            <span>{group.borrowerName}</span>
            <span>DNI: {group.borrowerDni || '—'}</span>
            <span>Tel: {group.borrowerPhone || '—'}</span>
            <span>Emitido: {formatDate(group.issuedAt)}</span>
          </div>
        </CardHeader>
        <CardContent className="flex-1 space-y-6 overflow-y-auto pt-6 pr-1">
          <div className="grid gap-3 md:grid-cols-2">
            <ModalMetric
              label="Total del préstamo"
              value={formatCurrency(totalAmount)}
            />
            <ModalMetric
              label="Total cobrado"
              value={formatCurrency(paidAmount)}
            />
            <ModalMetric
              label="Cuotas pagas"
              value={`${paidCount} de ${group.operations.length}`}
            />
            <ModalMetric
              label="Cuotas en mora"
              value={overdueCount.toString()}
            />
            <ModalMetric label="Emitido" value={formatDate(group.issuedAt)} />
            <ModalMetric label="Frecuencia" value={frequencyLabel} />
          </div>
          <div className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-body-light/60">
              Detalle de cuotas
            </p>
            <div className="space-y-2">
              {group.operations.map((operation) => (
                <LoanInstallmentRow
                  key={`${operation.loanId}-${operation.sequence}`}
                  operation={operation}
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

function LoanInstallmentRow({ operation }: { operation: Operation }) {
  const badgeVariant =
    operation.status === 'PAID'
      ? 'success'
      : operation.status === 'OVERDUE'
        ? 'danger'
        : 'warning';
  return (
    <div className="grid gap-3 rounded-xl border border-white/25 bg-white/70 px-4 py-3 text-sm text-body-light transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-[1px] hover:border-white/40 hover:bg-white/80 hover:shadow-subtle md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_auto] md:items-center">
      <div className="space-y-1">
        <p className="font-semibold text-body-light">
          Cuota {operation.sequence}
        </p>
        <p className="text-xs text-body-light/60">
          Vence {formatDate(operation.dueDate)}
        </p>
        {operation.paidAt ? (
          <p className="text-xs text-body-light/60">
            Pagada el {formatDate(operation.paidAt)}
            {operation.method ? ` · ${operation.method}` : ''}
          </p>
        ) : (
          <p className="text-xs text-body-light/60">
            {operation.status === 'OVERDUE' ? 'En mora' : 'Pendiente de pago'}
            {operation.method ? ` · ${operation.method}` : ''}
          </p>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={badgeVariant} className={STATUS_BADGE_CLASS}>
          {statusLabel(operation.status)}
        </Badge>
      </div>
      <div className="text-right font-semibold text-body-light tabular-nums min-w-[100px]">
        {formatCurrency(operation.amount)}
      </div>
    </div>
  );
}

function ModalMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/25 bg-white/70 px-4 py-3 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-[1px] hover:border-white/35 hover:bg-white/80 hover:shadow-subtle">
      <p className="text-xs font-medium uppercase tracking-[0.12em] text-body-light/60">
        {label}
      </p>
      <p className="text-sm font-semibold text-body-light">{value}</p>
    </div>
  );
}

function statusLabel(status: OperationStatus) {
  switch (status) {
    case 'PAID':
      return 'Pagada';
    case 'OVERDUE':
      return 'En mora';
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
