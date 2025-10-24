import React from 'react';
import clsx from 'clsx';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const baseStyles =
  'flex h-10 w-full rounded-lg border border-white/40 bg-white/70 px-4 py-2 text-sm text-body-light shadow-subtle transition-all duration-[180ms] ease-[cubic-bezier(0.22,1,0.36,1)] backdrop-blur-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:bg-white disabled:cursor-not-allowed disabled:bg-white/40 disabled:text-body-light/60';

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => <input ref={ref} className={clsx(baseStyles, className)} {...props} />
);

Input.displayName = 'Input';
