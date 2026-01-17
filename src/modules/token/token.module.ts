import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TokenService } from './services/token.service';
import { CacheModule } from '@cache/cache.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TokenController } from './controllers/token.controller';

@Module({
  imports: [
    ConfigModule, // чтобы ConfigService точно был доступен
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),
    CacheModule
  ],
  controllers: [TokenController],
  providers: [TokenService],
  exports: [TokenService],
})
export class TokenModule {}
