import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { PermissionClientService } from './permission-client.service';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'PERMISSION_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
          queue: 'permission_service_queue',
          queueOptions: {
            durable: true,
          },
        },
      },
    ]),
  ],
  providers: [PermissionClientService],
  exports: [PermissionClientService],
})
export class PermissionClientModule {}
