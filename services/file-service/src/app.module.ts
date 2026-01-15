import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { join } from 'path';
import { FileModule } from './modules/file/file.module';
import { StorageModule } from './modules/storage/storage.module';
import { RoomModule } from './modules/room/room.module';
import { S3Module } from './modules/s3/s3.module';
import { PermissionClientModule } from './modules/permission-client/permission-client.module';
import { TokenClientModule } from './modules/token-client/token-client.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        join(__dirname, '..', '..', `.env.${process.env.NODE_ENV || 'development'}`),
        join(__dirname, '..', '..', '.env'),
      ],
    }),
    MongooseModule.forRootAsync({
      useFactory: () => ({
        uri: process.env.MONGO_URL || '',
      }),
    }),
    PermissionClientModule,
    TokenClientModule,
    S3Module,
    FileModule,
    StorageModule,
    RoomModule,
  ],
})
export class AppModule {}
