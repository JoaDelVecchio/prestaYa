import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': ['ts-jest', { tsconfig: 'tsconfig.json' }]
  },
  collectCoverageFrom: [
    'activity/activity.service.ts',
    'common/guards/supabase-auth.guard.ts',
    'common/request-context.service.ts',
    'common/utils/**/*.ts',
    'loans/loan.service.ts',
    'webhooks/webhook.controller.ts'
  ],
  coverageDirectory: '../coverage',
  testEnvironment: 'node'
};

export default config;
