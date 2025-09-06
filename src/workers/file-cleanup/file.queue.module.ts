import { Module } from "@nestjs/common";
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from "@nestjs/config";
import { AppConfig } from "src/config/configuration.interface";
import { QueueOptions } from "bullmq";
import { S3Module } from "src/s3/s3.module";
import { FileModule } from "src/modules/file/files.module";

@Module({
  imports: [
    ConfigModule,
    BullModule.registerQueueAsync({
        configKey: 'bull-config',
        name: 'file-cleanup',
    }),
    S3Module,
  ],
})
export class FileCleanModuleApp {}
