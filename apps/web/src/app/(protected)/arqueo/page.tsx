'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { getCashSummary, getPayments, getLoans } from '@/lib/api';
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
import { useActionFeedback } from '@/hooks/useActionFeedback';

export const dynamic = 'force-dynamic';

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
      };
    }),
  );
}

export default function ArqueoPage() {
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
  const [selectedOp, setSelectedOp] = useState<Operation | null>(null);

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

  const filteredOperations = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return operations.filter((operation) => {
      if (statusFilter !== 'ALL' && operation.status !== statusFilter) {
        return false;
      }
      if (!term) return true;
      const haystack = [
        operation.borrowerName,
        operation.borrowerDni ?? '',
        operation.borrowerPhone ?? '',
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [operations, statusFilter, searchTerm]);

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Arqueo diario</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <SummaryMetric
            label="Total cobrado"
            value={`$${summary.totalCollected.toFixed(2)}`}
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

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Historial de transacciones</CardTitle>
              <p className="text-sm text-body-light/60">
                Consultá todos los movimientos del sistema.
              </p>
            </div>
            <StatusFilter filter={statusFilter} onChange={setStatusFilter} />
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <Label htmlFor="operation-search">Buscar operaciones</Label>
            <div className="relative inline-flex w-full max-w-md items-center">
              <Input
                id="operation-search"
                placeholder="Buscar por nombre, DNI o teléfono"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="pl-10"
              />
              <span className="pointer-events-none absolute left-4 text-body-light/40">
                🔍
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {filteredOperations.map((op) => (
              <OperationRow
                key={`${op.loanId}-${op.sequence}`}
                operation={op}
                onDetails={() => setSelectedOp(op)}
              />
            ))}
            {filteredOperations.length === 0 && (
              <p className="text-sm text-body-light/70">
                No encontramos operaciones con ese filtro.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <OperationModal
        operation={selectedOp}
        onClose={() => setSelectedOp(null)}
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
    <div className="rounded-2xl border border-white/20 bg-white/70 px-5 py-4 shadow-subtle backdrop-blur-lg">
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
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/60 p-1 backdrop-blur-lg">
      {STATUS_FILTERS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={
            option.value === filter
              ? 'rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-white shadow-subtle transition-all'
              : 'rounded-full px-4 py-1.5 text-sm font-medium text-body-light/70 transition-all hover:bg-white/70'
          }
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function OperationRow({
  operation,
  onDetails,
}: {
  operation: Operation;
  onDetails: () => void;
}) {
  const badgeVariant =
    operation.status === 'PAID'
      ? 'success'
      : operation.status === 'OVERDUE'
        ? 'danger'
        : 'warning';
  return (
    <div className="grid gap-4 rounded-xl border border-white/25 bg-white/65 px-5 py-4 shadow-subtle backdrop-blur-lg md:grid-cols-4 md:items-center">
      <div className="md:col-span-2 space-y-1">
        <p className="text-sm font-semibold text-body-light">
          {operation.borrowerName}
        </p>
        <p className="text-xs text-body-light/60">
          DNI: {operation.borrowerDni || '—'}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Badge variant={badgeVariant}>{operation.status}</Badge>
        <span className="text-body-light/70 text-sm">
          ${operation.amount.toFixed(2)}
        </span>
      </div>
      <div className="flex items-center justify-end">
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
  );
}

function OperationModal({
  operation,
  onClose,
}: {
  operation: Operation | null;
  onClose: () => void;
}) {
  const close = useCallback(() => {
    onClose();
  }, [onClose]);

  if (!operation) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <Card className="w-full max-w-lg shadow-pop">
        <CardHeader>
          <CardTitle>Detalle de operación</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-body-light/80">
          <DetailRow label="Cliente" value={operation.borrowerName} />
          <DetailRow label="DNI" value={operation.borrowerDni || '—'} />
          <DetailRow label="Teléfono" value={operation.borrowerPhone || '—'} />
          <DetailRow label="Estado" value={operation.status} />
          <DetailRow
            label="Importe"
            value={`$${operation.amount.toFixed(2)}`}
          />
          <DetailRow
            label="Fecha de vencimiento"
            value={new Date(operation.dueDate).toLocaleString('es-AR')}
          />
          {operation.paidAt && (
            <DetailRow
              label="Pagado el"
              value={new Date(operation.paidAt).toLocaleString('es-AR')}
            />
          )}
          {operation.method && (
            <DetailRow label="Método" value={operation.method} />
          )}
        </CardContent>
        <div className="flex justify-end px-6 pb-6">
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

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-white/30 bg-white/70 px-4 py-2">
      <span className="text-xs font-medium uppercase tracking-[0.12em] text-body-light/60">
        {label}
      </span>
      <span className="text-sm font-semibold text-body-light">{value}</span>
    </div>
  );
}
