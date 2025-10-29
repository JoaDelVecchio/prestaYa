import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  // eslint-disable-next-line no-console
  console.log('Creating Nest application...');
  const app = await NestFactory.create(AppModule);
  const allowedOriginsEnv = process.env.WEB_ORIGIN || process.env.WEB_ORIGINS;
  const allowedOrigins = allowedOriginsEnv
    ? allowedOriginsEnv
        .split(',')
        .map((origin) => origin.trim())
        .filter((origin) => origin.length > 0)
    : ['http://localhost:3000', 'https://localhost:3000'];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-org-id',
      'x-user-role',
    ],
  });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  // eslint-disable-next-line no-console
  console.log(`Listening on port ${process.env.PORT || 3131}...`);
  await app.listen(process.env.PORT || 3131);
  // eslint-disable-next-line no-console
  console.log('Nest application started');
}

bootstrap().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Nest application failed to start', error);
  process.exit(1);
});
