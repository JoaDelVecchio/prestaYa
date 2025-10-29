import path from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';
import globals from 'globals';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const config = [
  {
    ignores: ['.next/**', 'node_modules/**', 'dist/**', 'coverage/**', 'test-results/**'],
  },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        React: true,
      },
    },
  },
  ...compat.config({
    extends: ['next/core-web-vitals', 'next/typescript'],
  }),
];

export default config;
