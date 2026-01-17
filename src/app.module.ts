import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { configuration } from './config/configuration';
import { ScheduleModule } from '@nestjs/schedule';
import { UserModule } from './modules/user/user.module';
import { FileClientModule } from './modules/file-client/file-client.module';
import { AuthModule } from './auth/auth.module';
import { PermissionModule } from './modules/permission/permission.module';
import { TokenModule } from './modules/token/token.module';
import { BullConfigModule } from './config/modules/bull-config.module';
import { DatabaseModule } from './config/modules/database.module';
import { AppConfig } from './config/configuration.interface';
import { FileModule } from './modules/file/files.module';
import { RoomModule } from './modules/room/room.module';
import { UserStorageModule } from './modules/storage/user_storage.module';
import { UserIpInterceptor } from '@common/interceptors/user.ip.interceptor';
import { RolesGuard } from '@auth/guards/roles-guard';

@Module({
  imports: [
    ConfigModule.forRoot<AppConfig>({
      load: [configuration],
      isGlobal: true,
      envFilePath: [`.env.${process.env.NODE_ENV || 'development'}`, '.env'],
    }),

    DatabaseModule,
    BullConfigModule,
    ScheduleModule.forRoot(),

    UserModule,
    AuthModule,
    PermissionModule,
    TokenModule,
    FileClientModule,
    FileModule,
    RoomModule,
    UserStorageModule,
  ],
  controllers: [AppController],
  providers: [AppService, UserIpInterceptor, RolesGuard],
})
export class AppModule {}
