import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { LoanModule } from './loans/loan.module';
import { ActivityModule } from './activity/activity.module';
import { StorageModule } from './storage/storage.module';
import { WebhookModule } from './webhooks/webhook.module';
import { SupabaseAuthGuard } from './common/guards/supabase-auth.guard';
import { RequestContextModule } from './common/request-context.module';
import { MetricsModule } from './metrics/metrics.module';
import { PaymentModule } from './payments/payment.module';
import { UserModule } from './users/user.module';
import { RequestContextMiddleware } from './common/request-context.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    StorageModule,
    ActivityModule,
    LoanModule,
    WebhookModule,
    RequestContextModule,
    MetricsModule,
    PaymentModule,
    UserModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: SupabaseAuthGuard }],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}
