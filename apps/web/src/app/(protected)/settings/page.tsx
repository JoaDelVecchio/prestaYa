export const dynamic = 'force-dynamic';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h1 className="text-[32px] font-semibold leading-[44.8px] text-body-light">Configuración</h1>
        <p className="text-sm text-body-light/70">
          Administrá las preferencias del sistema y los accesos de la organización desde esta sección.
        </p>
      </div>
      <div className="rounded-xl border border-dashed border-white/30 bg-white/50 p-6 text-sm text-body-light/70">
        Próximamente vas a poder gestionar usuarios, permisos y parámetros generales.
      </div>
    </div>
  );
}
