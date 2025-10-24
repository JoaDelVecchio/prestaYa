import React from 'react';
import clsx from 'clsx';

export type CardProps = React.HTMLAttributes<HTMLDivElement>;

export const Card = ({ className, ...props }: CardProps) => (
  <div
    className={clsx(
      'rounded-2xl border border-white/40 bg-white/75 p-6 shadow-subtle backdrop-blur-xl transition-all duration-[180ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:shadow-hover hover:scale-[1.01]',
      className
    )}
    {...props}
  />
);

export const CardHeader = ({ className, ...props }: CardProps) => (
  <div className={clsx('mb-4 flex flex-col gap-1.5', className)} {...props} />
);

export const CardTitle = ({ className, ...props }: CardProps) => (
  <h3 className={clsx('text-xl font-semibold text-body-light tracking-tight', className)} {...props} />
);

export const CardContent = ({ className, ...props }: CardProps) => (
  <div className={clsx('text-sm text-body-light/85', className)} {...props} />
);
