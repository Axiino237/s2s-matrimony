import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { json, urlencoded } from 'express';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Rewrite standard Razorpay payment routes to v1 payments controller
  app.use((req: any, _res: any, next: any) => {
    if (req.url === '/api/create-order' || req.url?.startsWith('/api/create-order?')) {
      req.url = req.url.replace('/api/create-order', '/api/v1/payments/create-order');
    } else if (req.url === '/api/verify-payment' || req.url?.startsWith('/api/verify-payment?')) {
      req.url = req.url.replace('/api/verify-payment', '/api/v1/payments/verify-payment');
    } else if (req.url === '/api/v1/create-order' || req.url?.startsWith('/api/v1/create-order?')) {
      req.url = req.url.replace('/api/v1/create-order', '/api/v1/payments/create-order');
    } else if (req.url === '/api/v1/verify-payment' || req.url?.startsWith('/api/v1/verify-payment?')) {
      req.url = req.url.replace('/api/v1/verify-payment', '/api/v1/payments/verify-payment');
    }
    next();
  });

  // Middleware — Body limits & cookie parser
  app.use(json({ limit: '15mb' }));
  app.use(urlencoded({ limit: '15mb', extended: true }));
  app.use(cookieParser());

  // CORS
  app.enableCors({
    origin: configService.get('FRONTEND_URL', 'http://localhost:5173'),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('S2S Community Matrimony API')
    .setDescription('Complete REST API for S2S Matrimony platform')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Auth', 'Authentication & OTP')
    .addTag('Profiles', 'Profile management')
    .addTag('Search', 'Search & filters')
    .addTag('Interests', 'Interest management')
    .addTag('Chat', 'Real-time messaging')
    .addTag('Payments', 'Razorpay billing')
    .addTag('Admin', 'Admin operations')
    .addTag('Super Admin', 'Super admin operations')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = configService.get('PORT', 3001);
  await app.listen(port);

  logger.log(`🚀 S2S Matrimony API running on http://localhost:${port}`);
  logger.log(`📚 Swagger docs at http://localhost:${port}/api/docs`);
}

bootstrap();
