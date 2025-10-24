import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { LoanModule } from './loans/loan.module';
import { ActivityModule } from './activity/activity.module';
import { StorageModule } from './storage/storage.module';
import { WebhookModule } from './webhooks/webhook.module';
import { SupabaseAuthGuard } from './common/guards/supabase-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { RequestContextInterceptor } from './common/interceptors/context.interceptor';
import { RequestContextService } from './common/request-context.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    StorageModule,
    ActivityModule,
    LoanModule,
    WebhookModule
  ],
  providers: [
    RequestContextService,
    { provide: APP_GUARD, useClass: SupabaseAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_INTERCEPTOR, useClass: RequestContextInterceptor }
  ]
})
export class AppModule {}
