import { NextResponse } from 'next/server';
import { mockDb } from '@/lib/mock-db';
import type { ChargeLoanInput } from '@/lib/api.types';

type Params = {
  params: {
    id: string;
  };
};

export async function POST(request: Request, { params }: Params) {
  const payload = (await request.json()) as Omit<ChargeLoanInput, 'loanId'>;
  const result = mockDb.charge({ ...payload, loanId: params.id });
  return NextResponse.json(result);
}
