import { Card, CardContent, CardHeader, CardTitle } from '@prestaya/ui';
import { GlassLoading } from '@/app/(protected)/components/glass-loading';

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <Card className="transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]">
        <CardHeader>
          <CardTitle>Resumen de cobranza</CardTitle>
          <p className="text-sm text-body-light/60">
            Monitoreá el estado de tus cobros y cuotas pendientes.
          </p>
        </CardHeader>
        <CardContent className="flex min-h-[184px] items-center justify-center">
          <GlassLoading
            size="compact"
            label="Preparando resumen"
            helper="Estamos ensamblando tus métricas."
            className="w-full max-w-sm justify-center"
          />
        </CardContent>
      </Card>

      <Card className="transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]">
        <CardHeader className="space-y-2">
          <CardTitle>Gestionar cobros</CardTitle>
          <p className="text-sm text-body-light/60">
            Seleccioná un préstamo para registrar la próxima cuota.
          </p>
        </CardHeader>
        <CardContent className="flex min-h-[420px] items-center justify-center">
          <GlassLoading
            label="Cargando préstamos"
            helper="Obteniendo tus cobros más recientes."
            className="w-full max-w-md justify-center"
          />
        </CardContent>
      </Card>
    </div>
  );
}
