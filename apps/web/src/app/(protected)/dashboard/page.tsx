import { getLoansServer, getCashSummaryServer } from '@/lib/api.server';
import { Badge, Card, CardContent, CardHeader, CardTitle } from '@prestaya/ui';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

function statusVariant(status: string) {
  switch (status) {
    case 'PAID':
      return 'success';
    case 'OVERDUE':
      return 'danger';
    case 'REMINDED':
      return 'warning';
    default:
      return 'default';
  }
}

export default async function DashboardPage() {
  const [loans, summary] = await Promise.all([
    getLoansServer(),
    getCashSummaryServer(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total cobrado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-body-light/60">
                Total cobrado
              </p>
              <p className="text-3xl font-semibold text-body-light">
                {formatCurrency(summary.totalCollected)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Cuotas pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-body-light/60">
                Cuotas pendientes
              </p>
              <p className="text-3xl font-semibold text-body-light">
                {summary.pendingInstallments}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Cuotas en mora</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-body-light/60">
                Cuotas en mora
              </p>
              <p className="text-3xl font-semibold text-body-light">
                {summary.overdueInstallments}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-2xl">Préstamos activos</CardTitle>
            <p className="text-sm text-body-light/60">
              Gestioná tus préstamos desde un único lugar.
            </p>
          </div>
          <Link
            href="/dashboard/loans/create"
            className="inline-flex items-center rounded-full border border-white/40 bg-white/85 px-5 py-2.5 text-sm font-medium text-body-light shadow-subtle backdrop-blur-lg transition-all duration-[180ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-[1.05] hover:shadow-hover hover:text-body-light active:scale-[0.99]"
          >
            Nuevo préstamo
          </Link>
        </CardHeader>
        <CardContent className="mt-2">
          <div className="overflow-hidden rounded-2xl border border-white/30 bg-white/60 backdrop-blur-lg">
            <table className="min-w-full text-sm text-body-light/80">
              <thead className="bg-white/70 text-body-light/70">
                <tr>
                  <th className="px-5 py-3 text-left font-medium uppercase tracking-[0.12em]">
                    Cliente
                  </th>
                  <th className="px-5 py-3 text-left font-medium uppercase tracking-[0.12em]">
                    DNI
                  </th>
                  <th className="px-5 py-3 text-left font-medium uppercase tracking-[0.12em]">
                    Principal
                  </th>
                  <th className="px-5 py-3 text-left font-medium uppercase tracking-[0.12em]">
                    Estado
                  </th>
                  <th className="px-5 py-3 text-left font-medium uppercase tracking-[0.12em]">
                    Cuotas pagas
                  </th>
                  <th className="px-5 py-3 text-left font-medium uppercase tracking-[0.12em]">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {loans.map((loan) => {
                  const paid = loan.installments.filter(
                    (inst) => inst.status === 'PAID',
                  ).length;
                  return (
                    <tr
                      key={loan.id}
                      className="border-t border-white/20 transition-colors duration-[180ms] hover:bg-white/70"
                    >
                      <td className="px-5 py-3 font-medium text-body-light">
                        {loan.borrowerName}
                      </td>
                      <td className="px-5 py-3 text-body-light/75">
                        {loan.borrowerDni || '—'}
                      </td>
                      <td className="px-5 py-3 font-medium text-body-light">
                        ${loan.principal.toFixed(2)}
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant={statusVariant(loan.status)}>
                          {loan.status}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-body-light">
                        {paid} / {loan.installments.length}
                      </td>
                      <td className="px-5 py-3">
                        <Link
                          href={`/charge?loanId=${loan.id}`}
                          className="inline-flex items-center justify-center rounded-xl border border-accent/40 bg-accent px-4 py-2 text-sm font-medium text-white shadow-subtle transition-all duration-[180ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-accent/95 hover:text-white hover:scale-[1.04] hover:shadow-hover active:scale-[0.99]"
                        >
                          Cobrar
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
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
