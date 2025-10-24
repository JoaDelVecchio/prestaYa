import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RequestContextService } from '../common/request-context.service';
import { diffObjects } from '../common/utils/diff.util';
import { dayHash } from '../common/utils/hash.util';
import { Prisma } from '@prestaya/prisma';

@Injectable()
export class ActivityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly context: RequestContextService
  ) {}

  async log<T extends Record<string, unknown>>(
    loanId: string | null,
    action: string,
    before: T | null,
    after: T | null
  ) {
    const ctx = this.context.get();
    const diff = diffObjects(before, after) as unknown as Prisma.JsonObject;
    const timestamp = new Date();
    const hash = dayHash(ctx.orgId, timestamp);

    return this.prisma.activityLog.create({
      data: {
        orgId: ctx.orgId,
        loanId,
        actorId: ctx.userId,
        action,
        diff,
        dayHash: hash,
        createdAt: timestamp
      }
    });
  }

  async listForLoan(loanId: string) {
    const ctx = this.context.get();
    return this.prisma.activityLog.findMany({
      where: { loanId, orgId: ctx.orgId },
      orderBy: { createdAt: 'desc' }
    });
  }
}
