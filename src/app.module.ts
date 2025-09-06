import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { configuration } from './config/configuration';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppConfig } from './config/configuration.interface';
import { User } from './modules/user/entities/user.entity';
import { ScheduleModule } from '@nestjs/schedule';
import { UserModule } from './modules/user/user.module';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bullmq';
import { QueueOptions } from 'bullmq';
import { FileModule } from './modules/file/files.module';
import { RoomModule } from './modules/room/room.module';
import { UserStorageModule } from './modules/user_storage/user_storage.module';
import { S3Module } from './s3/s3.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
      envFilePath: [
        `.env.${process.env.NODE_ENV || 'development'}`,
        '.env'
      ]
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfig>) => {
        const postgresConfig = config.get('postgres');
          return {
          type: 'postgres',
          host: postgresConfig.host,
          port: postgresConfig.port,
          username: postgresConfig.username,
          password: postgresConfig.password,
          database: postgresConfig.database,
          entities: [User],
          synchronize: true,
          migrations: ['src/migrations/*.js'],
          logging: config.get('environment') === 'development',
        };
      }
    }),

    BullModule.forRootAsync( 'bull-config', {
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService<AppConfig>): QueueOptions => {
    
          const redisConfig = config.get<{ host: string; port: number; password: string }>('redis');
    
          if (!redisConfig) {
              throw new Error('Redis configuration is missing!')
          }
          return {
            connection: {
              host: redisConfig.host,
              port: redisConfig.port,
              password: redisConfig.password,
            },
          };
        },
    }),
    
    MongooseModule.forRoot('mongodb+srv://dmitrypikulik77:Sp88Lp2k88@demodrophub.pcjp8zi.mongodb.net/?retryWrites=true&w=majority&appName=DemoDropHub'),
    ScheduleModule.forRoot(),

    UserModule,
    FileModule,
    RoomModule,
    UserStorageModule,
    S3Module,

  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
