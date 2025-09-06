import { Module } from "@nestjs/common";
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from "@nestjs/config";
import { AppConfig } from "src/config/configuration.interface";
import { QueueOptions } from "bullmq";

@Module({
  imports: [
    BullModule.forRootAsync({
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
})
export class FileCleanModuleApp {}
