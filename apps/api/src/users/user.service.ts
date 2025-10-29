import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RequestContextService } from '../common/request-context.service';

type OrgUserResponse = {
  id: string;
  email: string;
  role: string;
};

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly context: RequestContextService,
  ) {}

  async list(): Promise<OrgUserResponse[]> {
    const ctx = this.context.get();

    const memberships = await this.prisma.userOrganisation.findMany({
      where: { organisationId: ctx.orgId },
      include: {
        user: true,
      },
      orderBy: {
        user: {
          email: 'asc',
        },
      },
    });

    return memberships.map((membership) => ({
      id: membership.userId,
      email: membership.user?.email ?? '',
      role: membership.role,
    }));
  }
}
