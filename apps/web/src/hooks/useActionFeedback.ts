import { useCallback, useEffect, useRef, useState } from 'react';
import { ActionStatus } from '../constants/motion';
import { triggerHapticError, triggerHapticSuccess } from '../lib/feedback';
const FLASH_DURATION = 800;
const SHAKE_DURATION = 280;
const AUTO_RESET = 1400;

export type VisualState = {
  spinner: boolean;
  check: boolean;
  error: boolean;
  progress: boolean;
  flash: boolean;
  shake: boolean;
  celebrate: boolean;
};

export interface UseActionFeedbackOptions {
  defaultLabel: string;
  successLabel?: string;
  errorLabel?: string;
}

export interface SuccessOptions {
  message?: string;
  celebrate?: boolean;
}

const initialVisualState: VisualState = {
  spinner: false,
  check: false,
  error: false,
  progress: false,
  flash: false,
  shake: false,
  celebrate: false,
};

export function useActionFeedback(options: UseActionFeedbackOptions) {
  const {
    defaultLabel,
    successLabel = '¡Listo!',
    errorLabel = 'Reintentar',
  } = options;
  const [status, setStatus] = useState<ActionStatus>('idle');
  const [label, setLabel] = useState(defaultLabel);
  const [message, setMessage] = useState('');
  const [visual, setVisual] = useState<VisualState>(initialVisualState);

  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shakeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (resetTimer.current) clearTimeout(resetTimer.current);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    if (shakeTimer.current) clearTimeout(shakeTimer.current);
    resetTimer.current = null;
    flashTimer.current = null;
    shakeTimer.current = null;
  }, []);

  const resetVisual = useCallback(() => {
    setVisual(initialVisualState);
  }, []);

  const reset = useCallback(() => {
    clearTimers();
    setStatus('idle');
    setLabel(defaultLabel);
    setMessage('');
    resetVisual();
  }, [clearTimers, defaultLabel, resetVisual]);

  const start = useCallback(
    (processingLabel = 'Procesando…') => {
      clearTimers();
      setStatus('running');
      setLabel(processingLabel);
      setMessage('');
      setVisual({
        spinner: true,
        check: false,
        error: false,
        progress: false,
        flash: false,
        shake: false,
        celebrate: false,
      });
    },
    [clearTimers],
  );

  const succeed = useCallback(
    (opts: SuccessOptions = {}) => {
      clearTimers();
      setStatus('success');
      setLabel(successLabel);
      if (opts.message) {
        setMessage(opts.message);
      } else {
        setMessage('');
      }
      setVisual({
        spinner: false,
        check: true,
        error: false,
        progress: false,
        flash: true,
        shake: false,
        celebrate: opts.celebrate ?? false,
      });
      triggerHapticSuccess();

      flashTimer.current = setTimeout(() => {
        setVisual((prev) => ({ ...prev, flash: false, celebrate: false }));
      }, FLASH_DURATION);

      resetTimer.current = setTimeout(() => {
        setStatus('idle');
        setLabel(defaultLabel);
        setVisual((prev) => ({ ...prev, check: false, celebrate: false }));
      }, AUTO_RESET);
    },
    [clearTimers, defaultLabel, successLabel],
  );

  const fail = useCallback(
    (errorMessage = 'Ocurrió un problema') => {
      clearTimers();
      setStatus('error');
      setLabel(errorLabel);
      setMessage(errorMessage);
      setVisual({
        spinner: false,
        check: false,
        error: true,
        progress: false,
        flash: false,
        shake: true,
        celebrate: false,
      });
      triggerHapticError();

      shakeTimer.current = setTimeout(() => {
        setVisual((prev) => ({ ...prev, shake: false }));
      }, SHAKE_DURATION);

      resetTimer.current = setTimeout(() => {
        setStatus('idle');
        setLabel(defaultLabel);
        setVisual((prev) => ({ ...prev, error: false }));
      }, AUTO_RESET);
    },
    [clearTimers, defaultLabel, errorLabel],
  );

  useEffect(() => () => clearTimers(), [clearTimers]);

  return {
    status,
    label,
    message,
    visual,
    start,
    success: succeed,
    error: fail,
    reset,
  };
}
