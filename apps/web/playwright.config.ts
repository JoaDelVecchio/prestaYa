import type { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
  testDir: './tests',
  timeout: 30 * 1000,
  webServer: {
    command: 'pnpm exec next start -p 3005',
    url: 'http://127.0.0.1:3005',
    reuseExistingServer: !process.env.CI,
    stdout: 'pipe',
    stderr: 'pipe'
  },
  use: {
    baseURL: 'http://127.0.0.1:3005',
    trace: 'on-first-retry'
  }
};

export default config;
