import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { QueueOptions } from "bullmq";
import { AppConfig } from "../configuration.interface";

@Module({
   imports: [
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
],
  exports: [BullModule],
})

export class BullConfigModule {};
    