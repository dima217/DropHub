import { Module } from "@nestjs/common";
import { S3Module } from "src/s3/s3.module";
import { FileQueueService } from "./services/file.queue.service";
import { ScheduleModule } from "@nestjs/schedule";
import { DatabaseModule } from "src/config/modules/database.module";
import { BullConfigModule } from "src/config/modules/bull-config.module";
import { BullModule } from "@nestjs/bullmq";

@Module({
  imports: [
    DatabaseModule,
    BullConfigModule,
    BullModule.registerQueueAsync({
        configKey: 'bull-config',
        name: 'file-cleanup',
    }),
    S3Module,
    ScheduleModule.forRoot(),
  ],

  providers: [FileQueueService],
  exports: [FileQueueService]
})
export class FileCleanAppModule {}
