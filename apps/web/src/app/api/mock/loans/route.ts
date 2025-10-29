import { NextResponse } from 'next/server';
import { mockDb } from '@/lib/mock-db';
import type { CreateLoanInput } from '@/lib/api.types';

export async function GET() {
  return NextResponse.json(mockDb.listLoans());
}

export async function POST(request: Request) {
  const payload = (await request.json()) as CreateLoanInput;
  const loan = mockDb.createLoan(payload);
  return NextResponse.json(loan, { status: 201 });
}
