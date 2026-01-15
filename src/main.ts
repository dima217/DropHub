import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { NestExpressApplication } from '@nestjs/platform-express';
import * as cookieParser from 'cookie-parser';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Подключаем микросервисы для обработки запросов от File Service
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
      queue: 'permission_service_queue',
      queueOptions: {
        durable: true,
      },
      prefetchCount: 1,
      persistent: true,
      noAck: false,
      socketOptions: {
        heartbeatIntervalInSeconds: 60,
        reconnectTimeInSeconds: 5,
      },
    },
  });

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
      queue: 'token_service_queue',
      queueOptions: {
        durable: true,
      },
      prefetchCount: 1,
      persistent: true,
      noAck: false,
      socketOptions: {
        heartbeatIntervalInSeconds: 60,
        reconnectTimeInSeconds: 5,
      },
    },
  });

  await app.startAllMicroservices();

  app.use(cookieParser);
  app.useGlobalPipes(new ValidationPipe());

  const configService = app.get(ConfigService);
  const swaggerConfig = configService.get('swagger');

  if (swaggerConfig?.enable) {
    const swaggerOptions = new DocumentBuilder()
      .setTitle(swaggerConfig.title || 'API')
      .setDescription(swaggerConfig.description || 'API Documentation')
      .setVersion(swaggerConfig.version || '1.0')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerOptions);
    SwaggerModule.setup(swaggerConfig.path || 'api', app, document);
  }
  app.enableCors();
  const port = configService.get<number>('port') || 3000;
  await app.listen(port, '0.0.0.0');
}
bootstrap();
