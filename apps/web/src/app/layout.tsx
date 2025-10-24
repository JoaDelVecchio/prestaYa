import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-sf', display: 'swap' });

export const metadata: Metadata = {
  title: 'PrestaYa - Gestor de Préstamos Cash Only',
  description: 'MVP para administrar préstamos y cobranzas manuales'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${inter.variable} min-h-screen font-sans antialiased`}>{children}</body>
    </html>
  );
}
