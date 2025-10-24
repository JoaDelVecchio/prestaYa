import React from 'react';
import clsx from 'clsx';

export type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement>;

export const Label = ({ className, ...props }: LabelProps) => (
  <label
    className={clsx('text-xs font-medium uppercase tracking-[0.12em] text-body-light/70', className)}
    {...props}
  />
);
