import { getLoansServer } from '@/lib/api.server';
import { ChargePageClient } from './charge-client';

export const revalidate = 0;

export default async function ChargePage() {
  const loans = await getLoansServer();
  return <ChargePageClient initialLoans={loans} />;
}
