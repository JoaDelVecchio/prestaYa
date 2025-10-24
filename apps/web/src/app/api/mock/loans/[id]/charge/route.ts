import { NextResponse } from 'next/server';
import { mockDb, ChargePayload } from '@/lib/mock-db';

type Params = {
  params: {
    id: string;
  };
};

export async function POST(request: Request, { params }: Params) {
  const payload = (await request.json()) as Omit<ChargePayload, 'loanId'>;
  const result = mockDb.charge({ ...payload, loanId: params.id });
  return NextResponse.json(result);
}
