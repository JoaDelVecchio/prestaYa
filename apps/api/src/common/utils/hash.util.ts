import { createHash } from 'node:crypto';

export function dayHash(orgId: string, timestamp: Date): string {
  const dayKey = timestamp.toISOString().slice(0, 10);
  return createHash('sha256').update(`${orgId}:${dayKey}`).digest('hex');
}
