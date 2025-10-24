'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { PropsWithChildren } from 'react';
import { Button } from '@prestaya/ui';
import clsx from 'clsx';

const navigation = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/dashboard/loans/create', label: 'Crear Préstamo' },
  { href: '/charge', label: 'Cobrar' },
  { href: '/historial', label: 'Historial' },
];

export default function ProtectedLayout({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const router = useRouter();

  const logout = () => {
    document.cookie = 'sb-access-token=; path=/; max-age=0';
    router.push('/login');
  };

  return (
    <div className="flex min-h-screen">
      <aside className="glass-surface sticky top-6 ml-6 mt-6 flex h-[calc(100vh-3rem)] w-64 flex-col rounded-3xl border border-white/40 p-6 shadow-subtle">
        <div className="mb-8">
          <p className="text-lg font-semibold text-body-light">PrestaYa</p>
          <p className="text-xs text-body-light/60">Cash-only Loan Manager</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1.5">
          {navigation.map((item) => {
            const isDashboardRoot = item.href === '/dashboard';
            const isActive = isDashboardRoot
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                className={clsx(
                  'rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-[2px] hover:scale-[1.03] hover:shadow-hover hover:ring-1 hover:ring-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                  isActive
                    ? 'bg-accent text-white shadow-hover ring-1 ring-white/40 hover:bg-accent/95 hover:text-white'
                    : 'text-body-light/80 hover:bg-white/80 hover:text-body-light',
                )}
                href={item.href}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto flex flex-col gap-3 pt-8">
          <Link
            href="/settings"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/40 bg-white/80 px-4 py-3 text-sm font-medium text-body-light shadow-subtle transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-[1px] hover:shadow-hover hover:text-body-light"
          >
            <span>Configuración</span>
          </Link>
          <Button className="w-full" variant="secondary" onClick={logout}>
            Salir
          </Button>
        </div>
      </aside>
      <main className="flex-1 px-10 py-12">
        <div className="mx-auto max-w-5xl space-y-6">{children}</div>
      </main>
    </div>
  );
}
