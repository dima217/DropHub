// cache.module.ts
import { Module } from '@nestjs/common';
import { CacheService } from './cache.service';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-redis-store';
import { RedisModule } from './redis.module';

@Module({
  imports: [
    NestCacheModule.registerAsync({
      imports: [RedisModule],
      inject: ['REDIS_CLIENT'],
      useFactory: async (redisClient) => ({
        store: redisStore,
        client: redisClient,
        ttl: 300,
      }),
    }),
    RedisModule, 
  ],
  providers: [CacheService],
  exports: [CacheService],
})
export class CacheModule {}
