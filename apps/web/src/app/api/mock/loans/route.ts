import { NextResponse } from 'next/server';
import { mockDb, CreateLoanPayload } from '@/lib/mock-db';

export async function GET() {
  return NextResponse.json(mockDb.listLoans());
}

export async function POST(request: Request) {
  const payload = (await request.json()) as CreateLoanPayload;
  const loan = mockDb.createLoan(payload);
  return NextResponse.json(loan, { status: 201 });
}
