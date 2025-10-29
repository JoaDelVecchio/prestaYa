import { Card, CardContent, CardHeader, CardTitle } from '@prestaya/ui';
import { GlassLoading } from '@/app/(protected)/components/glass-loading';

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Arqueo diario</CardTitle>
        </CardHeader>
        <CardContent className="flex min-h-[184px] items-center justify-center">
          <GlassLoading
            size="compact"
            label="Preparando resumen"
            helper="Estamos obteniendo los totales del día."
            className="w-full max-w-sm justify-center"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historial de transacciones</CardTitle>
        </CardHeader>
        <CardContent className="flex min-h-[360px] items-center justify-center">
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
