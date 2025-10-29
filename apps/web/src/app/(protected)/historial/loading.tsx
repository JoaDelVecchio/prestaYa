import { Card, CardContent, CardHeader, CardTitle } from '@prestaya/ui';
import { GlassLoading } from '@/app/(protected)/components/glass-loading';

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <Card className="transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]">
        <CardHeader>
          <CardTitle>Historial diario</CardTitle>
        </CardHeader>
        <CardContent className="flex min-h-[184px] items-center justify-center">
          <GlassLoading
            size="compact"
            label="Preparando resumen"
            helper="Estamos obteniendo tu resumen de caja."
            className="w-full max-w-sm justify-center"
          />
        </CardContent>
      </Card>

      <Card className="transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]">
        <CardHeader className="space-y-2">
          <CardTitle>Historial de transacciones</CardTitle>
          <p className="text-sm text-body-light/60">
            Consultá todos los movimientos del sistema.
          </p>
        </CardHeader>
        <CardContent className="flex min-h-[480px] items-center justify-center">
          <GlassLoading
            label="Cargando operaciones"
            helper="Sincronizando movimientos recientes."
            className="w-full max-w-md justify-center"
          />
        </CardContent>
      </Card>
    </div>
  );
}
