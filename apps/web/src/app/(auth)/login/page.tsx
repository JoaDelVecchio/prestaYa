'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from '@prestaya/ui';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('owner@prestaya.io');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    const response = await fetch('/api/auth/mock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    if (response.ok) {
      setMessage('Magic link enviado. Redirigiendo...');
      setTimeout(() => router.push('/dashboard'), 500);
    } else {
      setMessage('No pudimos iniciar sesión. Reintenta.');
    }
    setLoading(false);
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center px-4 py-16">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(10,132,255,0.12)_0,_rgba(255,255,255,0)_55%)]" />
      <Card className="relative w-full max-w-md">
        <CardHeader className="mb-6 text-center">
          <CardTitle className="text-2xl font-semibold">Ingresá a PrestaYa</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Correo</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="tu@empresa.com"
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar Magic Link'}
            </Button>
            {message && <p className="text-sm text-body-light/70 text-center">{message}</p>}
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
