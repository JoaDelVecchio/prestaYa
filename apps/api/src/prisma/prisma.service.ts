import { INestApplication, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prestaya/prisma';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: process.env.NODE_ENV === 'test' ? [] : ['warn', 'error']
    });
  }

  async onModuleInit(): Promise<void> {
    if (process.env.NODE_ENV === 'test') {
      this.logger.debug('Skipping prisma connect in test mode');
      return;
    }

    try {
      await this.$connect();
      this.logger.log('Prisma connected');
    } catch (error) {
      this.logger.error('Prisma connection failed', error as Error);
      throw error;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
