import React from 'react';
import clsx from 'clsx';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger';

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant };

const variants: Record<BadgeVariant, string> = {
  default: 'bg-white/70 text-body-light shadow-subtle backdrop-blur-sm border border-white/40',
  success: 'bg-emerald-500/18 text-emerald-600 border border-emerald-500/24',
  warning: 'bg-amber-500/18 text-amber-600 border border-amber-500/24',
  danger: 'bg-rose-500/18 text-rose-600 border border-rose-500/24'
};

export const Badge = ({ className, variant = 'default', ...props }: BadgeProps) => (
  <span
    className={clsx(
      'inline-flex items-center rounded-2xl px-3.5 py-1.5 text-xs font-medium transition-all duration-[180ms] ease-[cubic-bezier(0.22,1,0.36,1)] capitalize tracking-wide',
      variants[variant],
      className
    )}
    {...props}
  />
);
