import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { RmqOptions, Transport } from '@nestjs/microservices';
import multipart from '@fastify/multipart';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter()
  );

  app.connectMicroservice<RmqOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [`amqp://rabbitmq:5672`],
      queue: 'create_charge_psp',
      prefetchCount: 1,
      persistent: true,
      noAck: false,
      queueOptions: {
        durable: true,
      },
      socketOptions: {
        heartbeatIntervalInSeconds: 60,
        reconnectTimeInSeconds: 5,
      },
    },
  });

  await app.startAllMicroservices();
  
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
;
  app.enableCors();
  await app.register(multipart);
  const port = configService.get<number>('port') || 3000;
  await app.listen(port, '0.0.0.0');
}
bootstrap();