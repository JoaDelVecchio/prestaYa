import clsx from 'clsx';

export type GlassLoadingProps = {
  label?: string;
  helper?: string;
  size?: 'default' | 'compact';
  className?: string;
};

export function GlassLoading({
  label = 'Cargando...',
  helper,
  size = 'default',
  className,
}: GlassLoadingProps) {
  const containerClasses = clsx(
    'relative isolate flex flex-col items-center gap-4 overflow-hidden border border-white/30 bg-white/30 text-body-light shadow-subtle backdrop-blur-xl',
    size === 'compact' ? 'rounded-2xl px-6 py-5' : 'rounded-3xl px-8 py-10',
    className,
  );

  const spinnerWrapperClasses = clsx(
    'flex items-center justify-center rounded-full border border-white/50 bg-white/60 shadow-inner shadow-white/30',
    size === 'compact' ? 'h-10 w-10' : 'h-12 w-12',
  );

  const spinnerClasses = clsx(
    'inline-flex animate-spin rounded-full border-[3px] border-white/50 border-t-accent/90',
    size === 'compact' ? 'h-6 w-6' : 'h-8 w-8',
  );

  return (
    <div className={containerClasses}>
      <div className="absolute inset-0 -z-20 bg-gradient-to-br from-white/70 via-white/25 to-white/5 opacity-70" />
      <div className="absolute inset-0 -z-10 blur-3xl">
        <div className="absolute left-1/2 top-0 h-40 w-40 -translate-x-1/2 rounded-full bg-accent/25 opacity-70" />
        <div className="absolute bottom-0 right-10 h-28 w-28 rounded-full bg-accent/15 opacity-60" />
      </div>
      <div className="absolute inset-0 -z-10 animate-[pulse_5s_ease-in-out_infinite] bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.75),transparent_62%)]" />
      <div className={spinnerWrapperClasses}>
        <span className={spinnerClasses} />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-body-light">{label}</p>
        {helper ? <p className="text-xs text-body-light/70">{helper}</p> : null}
      </div>
    </div>
  );
}
