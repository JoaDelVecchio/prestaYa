'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createLoan } from '@/lib/api';
import {
  ActionButton,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from '@prestaya/ui';
import { useActionFeedback } from '@/hooks/useActionFeedback';

const toDateInputValue = (date: Date) => date.toISOString().split('T')[0];

const defaultFirstDueDate = (() => {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return toDateInputValue(date);
})();

const initialState = {
  borrowerName: '',
  borrowerPhone: '',
  borrowerDni: '',
  principal: '',
  interestRate: '',
  numberOfInstallments: '',
  frequency: 'monthly' as const,
  firstDueDate: defaultFirstDueDate,
};

const amountFormatter = new Intl.NumberFormat('es-AR', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

function formatAmountInput(rawValue: string) {
  const normalized = rawValue
    .replace(/\s/g, '')
    .replace(/\./g, '')
    .replace(/,/g, '.')
    .replace(/[^\d.]/g, '');

  if (!normalized) {
    return '';
  }

  const [integerPartRaw, decimalPartRaw] = normalized.split('.');
  const integerPart = integerPartRaw || '0';
  const limitedDecimals = decimalPartRaw ? decimalPartRaw.slice(0, 2) : '';
  const formattedInteger = amountFormatter.format(Number(integerPart));

  return limitedDecimals
    ? `${formattedInteger},${limitedDecimals}`
    : formattedInteger;
}

function parseAmount(value: string) {
  const normalized = value
    .replace(/\./g, '')
    .replace(/,/g, '.')
    .replace(/[^\d.]/g, '');
  if (!normalized) {
    return NaN;
  }
  return Number(normalized);
}

export default function CreateLoanPage() {
  const router = useRouter();
  const [form, setForm] = useState(initialState);
  const action = useActionFeedback({
    defaultLabel: 'Guardar préstamo',
    successLabel: '¡Listo!',
    errorLabel: 'Reintentar',
  });

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handlePrincipalChange = (value: string) => {
    setForm((prev) => ({ ...prev, principal: formatAmountInput(value) }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    action.start('Creando préstamo...');
    try {
      const principal = parseAmount(form.principal);
      const interestRate = Number(form.interestRate.replace(',', '.'));
      const installments = Number(form.numberOfInstallments);

      const invalidPrincipal = !Number.isFinite(principal) || principal <= 0;
      const invalidInterest =
        !Number.isFinite(interestRate) || interestRate <= 0;
      const invalidInstallments =
        !Number.isFinite(installments) || installments <= 0;

      if (invalidPrincipal || invalidInterest || invalidInstallments) {
        action.error('Completá los montos y la cantidad de cuotas');
        return;
      }

      const firstDueDateRaw = form.firstDueDate;
      if (!firstDueDateRaw) {
        action.error('Seleccioná la primera fecha de vencimiento');
        return;
      }

      const firstDueDate = new Date(firstDueDateRaw);
      if (Number.isNaN(firstDueDate.getTime())) {
        action.error('Fecha de primera cuota inválida');
        return;
      }

      await createLoan({
        borrowerName: form.borrowerName.trim(),
        borrowerPhone: form.borrowerPhone.trim() || undefined,
        borrowerDni: form.borrowerDni.trim(),
        principal,
        interestRate,
        numberOfInstallments: installments,
        frequency: form.frequency,
        firstDueDate: firstDueDate.toISOString(),
      });
      action.success({
        message: 'Préstamo creado correctamente',
        celebrate: true,
      });
      setTimeout(() => {
        router.push('/dashboard');
        router.refresh();
      }, 420);
    } catch (error) {
      action.error('No se pudo crear el préstamo');
      return;
    }
  };

  return (
    <Card className="transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-[2px] hover:shadow-hover focus-within:-translate-y-[2px] focus-within:shadow-hover">
      <CardHeader className="space-y-2">
        <CardTitle>Crear préstamo</CardTitle>
        <p className="text-sm text-body-light/60">
          Ingresá los datos del cliente y definí las condiciones del préstamo.
        </p>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-10 pt-4" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-body-light/60">
              Cliente
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2 flex flex-col gap-2">
                <Label htmlFor="borrowerName">Nombre completo</Label>
                <Input
                  id="borrowerName"
                  required
                  placeholder="Ej: Juan Pérez"
                  value={form.borrowerName}
                  onChange={(event) =>
                    updateField('borrowerName', event.target.value)
                  }
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="borrowerPhone">Teléfono</Label>
                <Input
                  id="borrowerPhone"
                  placeholder="Ej: +54 11 5555 0000"
                  value={form.borrowerPhone}
                  onChange={(event) =>
                    updateField('borrowerPhone', event.target.value)
                  }
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="borrowerDni">DNI</Label>
                <Input
                  id="borrowerDni"
                  inputMode="numeric"
                  minLength={6}
                  maxLength={12}
                  placeholder="Ej: 30123456"
                  value={form.borrowerDni}
                  onChange={(event) =>
                    updateField(
                      'borrowerDni',
                      event.target.value.replace(/[^0-9]/g, ''),
                    )
                  }
                  required
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-body-light/60">
              Préstamo
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="principal">Monto</Label>
                <Input
                  id="principal"
                  inputMode="decimal"
                  placeholder="Ej: 1.000"
                  value={form.principal}
                  onChange={(event) =>
                    handlePrincipalChange(event.target.value)
                  }
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="interestRate">Interés %</Label>
                <Input
                  id="interestRate"
                  inputMode="decimal"
                  placeholder="Ej: 15"
                  value={form.interestRate}
                  onChange={(event) =>
                    updateField(
                      'interestRate',
                      event.target.value.replace(/[^0-9.,]/g, ''),
                    )
                  }
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="installments">Cuotas</Label>
                <Input
                  id="installments"
                  inputMode="numeric"
                  placeholder="Ej: 12"
                  value={form.numberOfInstallments}
                  onChange={(event) =>
                    updateField(
                      'numberOfInstallments',
                      event.target.value.replace(/[^0-9]/g, ''),
                    )
                  }
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="frequency">Frecuencia</Label>
                <select
                  id="frequency"
                  className="h-11 w-full rounded-xl border border-white/40 bg-white/70 px-4 text-sm text-body-light shadow-subtle transition-all duration-[180ms] ease-[cubic-bezier(0.22,1,0.36,1)] backdrop-blur-md hover:shadow-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                  value={form.frequency}
                  onChange={(event) =>
                    updateField(
                      'frequency',
                      event.target.value as typeof form.frequency,
                    )
                  }
                >
                  <option value="monthly">Mensual</option>
                  <option value="biweekly">Quincenal</option>
                  <option value="weekly">Semanal</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="firstDueDate">Primera cuota</Label>
                <Input
                  id="firstDueDate"
                  type="date"
                  value={form.firstDueDate}
                  onChange={(event) =>
                    updateField('firstDueDate', event.target.value)
                  }
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <ActionButton
              type="submit"
              status={action.status}
              label={action.label}
              showSpinner={action.visual.spinner}
              showCheck={action.visual.check}
              showError={action.visual.error}
              showProgress={action.visual.progress}
              flash={action.visual.flash}
              shake={action.visual.shake}
              celebrate={action.visual.celebrate}
            />
            {action.message && (
              <span className="text-sm text-body-light/70">
                {action.message}
              </span>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
