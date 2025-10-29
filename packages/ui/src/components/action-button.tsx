import React from 'react';
import clsx from 'clsx';
import { Button, ButtonProps } from './button';

export interface ActionButtonProps extends ButtonProps {
  label: string;
  status: 'idle' | 'running' | 'success' | 'error';
  showSpinner?: boolean;
  showCheck?: boolean;
  showError?: boolean;
  showProgress?: boolean;
  flash?: boolean;
  shake?: boolean;
  celebrate?: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  type?: React.ButtonHTMLAttributes<HTMLButtonElement>['type'];
}

const confettiColors = ['#0A84FF', '#30D158', '#FF9F0A', '#FF453A', '#AC8AF8'];

const ConfettiOverlay: React.FC = () => (
  <span className="action-confetti" aria-hidden>
    {Array.from({ length: 12 }).map((_, index) => (
      <span
        key={index}
        style={
          {
            '--confetti-index': index,
            '--confetti-color': confettiColors[index % confettiColors.length],
          } as React.CSSProperties
        }
      />
    ))}
  </span>
);

export const ActionButton = React.forwardRef<
  HTMLButtonElement,
  ActionButtonProps
>(
  (
    {
      label,
      status,
      showSpinner,
      showCheck,
      showError,
      showProgress,
      flash,
      shake,
      celebrate,
      className,
      disabled,
      children,
      ...rest
    },
    ref,
  ) => {
    const icon = () => {
      if (showSpinner) {
        return <span className="action-spinner" aria-hidden />;
      }
      if (showCheck) {
        return (
          <span className="action-check" aria-hidden>
            <svg viewBox="0 0 20 20">
              <polyline points="3 10 8 15 17 5" />
            </svg>
          </span>
        );
      }
      if (showError) {
        return (
          <span className="action-error-icon" aria-hidden>
            <span className="action-error-ripple" />
            <svg viewBox="0 0 20 20">
              <circle cx="10" cy="10" r="8" />
              <line x1="10" y1="6" x2="10" y2="11" />
              <circle cx="10" cy="14" r="1" />
            </svg>
          </span>
        );
      }
      return null;
    };

    return (
      <div
        className={clsx('relative inline-flex', shake && 'action-shake')}
        aria-live="polite"
      >
        {showProgress && <span className="action-progress" />}
        <Button
          ref={ref}
          className={clsx(
            'relative overflow-hidden action-button-base',
            flash && 'action-flash',
            status === 'running' && 'action-running',
            status === 'success' && 'action-success',
            status === 'error' && 'action-error',
            className,
          )}
          disabled={disabled || status === 'running'}
          {...rest}
        >
          {celebrate && <ConfettiOverlay />}
          <span className="flex items-center justify-center gap-2">
            {icon()}
            <span>{label}</span>
          </span>
          {children}
        </Button>
      </div>
    );
  },
);

ActionButton.displayName = 'ActionButton';
