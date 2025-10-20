// src/token/token.service.ts

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CacheService } from 'src/cache/cache.service';

export enum AccessRole {
  READ = 'R',
  READ_WRITE = 'RW',
}

interface TokenPayload {
  tokenId: string;
  resourceId: string;
  resourceType: 'file' | 'room' | 'storage';
  role: 'R' | 'RW';
  exp: number;
}

@Injectable()
export class TokenService {
  private readonly REDIS_REVOKE_PREFIX = 'revoked:';

  constructor(
    private readonly jwtService: JwtService,
    private readonly cacheService: CacheService,
  ) {}

  async generateToken(
    payload: Omit<TokenPayload, 'tokenId' | 'exp'>,
    expiresIn: string = '7d',
  ): Promise<string> {
    const tokenId = this.generateUniqueId();
    const fullPayload = { ...payload, tokenId };

    return this.jwtService.sign(fullPayload, { expiresIn });
  }

  async validateToken(token: string): Promise<TokenPayload> {
    let payload: TokenPayload;

    try {
      payload = this.jwtService.verify(token) as TokenPayload;
    } catch (e) {
      throw new UnauthorizedException('Token is invalid or expired.');
    }

    const isRevoked = await this.cacheService.get<boolean>(
      this.REDIS_REVOKE_PREFIX + payload.tokenId,
    );

    if (isRevoked) {
      throw new UnauthorizedException('Token has been revoked.');
    }

    return payload;
  }

  async revokeToken(token: string): Promise<void> {
    const payload = await this.validateToken(token);

    const now = Math.floor(Date.now() / 1000);
    const ttlSeconds = payload.exp - now;

    if (ttlSeconds > 0) {
      await this.cacheService.set<boolean>(
        this.REDIS_REVOKE_PREFIX + payload.tokenId,
        true,
        ttlSeconds,
      );
    }
  }

  private generateUniqueId(): string {
    return (Math.random() + 1).toString(36).substring(2) + Date.now().toString(36);
  }
}
