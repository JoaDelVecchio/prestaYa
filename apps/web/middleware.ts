import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const PUBLIC_PATHS = ['/login', '/api/auth/mock'];

const secret = process.env.SUPABASE_JWT_SECRET || 'dev-super-secret';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  const token = request.cookies.get('sb-access-token')?.value;
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    jwt.verify(token, secret);
    return NextResponse.next();
  } catch (error) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: ['/dashboard/:path*', '/loans/:path*', '/charge/:path*', '/historial', '/usuarios']
};
