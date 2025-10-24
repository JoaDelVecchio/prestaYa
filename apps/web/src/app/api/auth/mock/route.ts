import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function POST(request: Request) {
  const body = await request.json();
  const email = body.email as string;

  if (!email) {
    return NextResponse.json({ error: 'email-required' }, { status: 400 });
  }

  const token = jwt.sign(
    {
      sub: 'mock-user',
      email,
      org_id: 'org-123',
      role: 'owner'
    },
    process.env.SUPABASE_JWT_SECRET || 'dev-super-secret',
    { expiresIn: '1h' }
  );

  const response = NextResponse.json({ ok: true });
  response.cookies.set('sb-access-token', token, {
    httpOnly: false,
    path: '/',
    maxAge: 60 * 60,
    sameSite: 'lax'
  });
  return response;
}
