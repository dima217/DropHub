// src/shared/cache/cache.service.ts
import { Injectable, Inject } from '@nestjs/common';
import type { RedisClientType } from 'redis';

@Injectable()
export class CacheService {
  private readonly defaultTTL = 300; 

  constructor(
    @Inject('REDIS_CLIENT') private readonly redisClient: RedisClientType
  ) {}

  async get<T>(key: string): Promise<T | undefined> {
    const result = await this.redisClient.get(key);
    return result ? JSON.parse(result) : undefined;
  }

  async set<T>(key: string, value: T, ttl: number = this.defaultTTL): Promise<void> {
    const serializedValue = JSON.stringify(value);
    await this.redisClient.setEx(key, ttl, serializedValue);
  }

  async wrap<T>(
    key: string,
    fn: () => Promise<T>,
    ttl: number = this.defaultTTL
  ): Promise<T> {
    const cachedValue = await this.get<T>(key);
    if (cachedValue) {
      return cachedValue;
    }

    const value = await fn();
    await this.set(key, value, ttl);
    return value;
  }

  async delete(key: string): Promise<void> {
    await this.redisClient.del(key);
  }

  async deleteByPattern(pattern: string): Promise<void> {
    const keys = await this.redisClient.keys(pattern);
    if (keys.length) await this.redisClient.del(keys);
  }

  async cacheWrapper<T>(key: string, fn: () => Promise<T>, ttl?: number): Promise<T> {
    try {
      return await this.wrap(key, fn, ttl);
    } catch (error) {
      console.error(`Cache error for key ${key}:`, error);
      return fn(); 
    }
  }
}
