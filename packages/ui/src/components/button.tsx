import React from 'react';
import clsx from 'clsx';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const baseStyles =
  'inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-all duration-[180ms] ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent disabled:pointer-events-none disabled:opacity-40 will-change-transform';

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-accent text-white shadow-subtle hover:shadow-hover hover:scale-[1.03] active:scale-[0.99] active:shadow-subtle',
  secondary:
    'bg-white/80 text-body-light shadow-subtle hover:bg-white hover:shadow-hover hover:scale-[1.03] active:scale-[0.99] active:bg-white/90',
  ghost:
    'bg-transparent text-accent hover:bg-accent/10 hover:shadow-hover hover:scale-[1.03] active:scale-[0.99]'
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', ...props }, ref) => (
    <button ref={ref} className={clsx(baseStyles, variantStyles[variant], className)} {...props} />
  )
);

Button.displayName = 'Button';
