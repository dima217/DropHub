// src/token/token.module.ts

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TokenService } from './services/token.service';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'SUPER_SECRET_FALLBACK_KEY',
      signOptions: { expiresIn: '7d' },
    }),
    CacheModule,
  ],
  providers: [TokenService],
  exports: [TokenService],
})
export class TokenModule {}
