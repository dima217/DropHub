import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { configuration } from './config/configuration';
import { ScheduleModule } from '@nestjs/schedule';
import { UserModule } from './modules/user/user.module';
import { FileModule } from './modules/file/files.module';
import { RoomModule } from './modules/room/room.module';
import { UserStorageModule } from './modules/user_storage/user_storage.module';
import { S3Module } from './s3/s3.module';
import { BullConfigModule } from './config/modules/bull-config.module';
import { DatabaseModule } from './config/modules/database.module';

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

    DatabaseModule,
    BullConfigModule,
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
