import type { Config } from 'tailwindcss';
import { fontFamily } from 'tailwindcss/defaultTheme';

const config: Config = {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sf)', 'SF Pro Text', 'SF Pro Display', 'Inter', ...fontFamily.sans]
      },
      colors: {
        surface: {
          DEFAULT: '#F5F5F7',
          muted: '#E1E1E6',
          dark: '#1C1C1E'
        },
        body: {
          DEFAULT: 'rgba(28, 28, 30, 0.85)',
          light: 'rgba(0, 0, 0, 0.85)',
          dark: 'rgba(245, 245, 247, 0.88)'
        },
        accent: {
          DEFAULT: '#0A84FF',
          foreground: '#FFFFFF'
        }
      },
      boxShadow: {
        subtle: '0 1px 3px rgba(0,0,0,0.12)',
        hover: '0 4px 12px rgba(0,0,0,0.08)',
        pop: '0 16px 32px rgba(0,0,0,0.16)'
      },
      transitionDuration: {
        swift: '180ms'
      },
      transitionTimingFunction: {
        swift: 'cubic-bezier(0.22, 1, 0.36, 1)'
      }
    }
  },
  plugins: []
};

export default config;
