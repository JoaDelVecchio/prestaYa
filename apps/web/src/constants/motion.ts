export const MOTION = {
  duration: {
    fast: 120,
    normal: 220,
    slow: 320
  },
  easing: {
    in: 'cubic-bezier(0.36, 0, 0.66, -0.56)',
    out: 'cubic-bezier(0.22, 1, 0.36, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)'
  }
};

export type ActionStatus = 'idle' | 'running' | 'success' | 'error';
