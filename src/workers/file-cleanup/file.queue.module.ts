import { Module } from '@nestjs/common';
import { FileQueueService } from './services/file.queue.service';
import { ScheduleModule } from '@nestjs/schedule';
import { BullConfigModule } from 'src/config/modules/bull-config.module';
import { BullModule } from '@nestjs/bullmq';
import { FileCleanupService } from './services/file-cleanup.service';
import { FileCleanUpProcessor } from './processors/file.queue.processor';
import { FileClientModule } from 'src/modules/file-client/file-client.module';

@Module({
  imports: [
    BullConfigModule,
    BullModule.registerQueueAsync({
      configKey: 'bull-config',
      name: 'file-cleanup',
    }),
    ScheduleModule.forRoot(),
    FileClientModule,
  ],
  providers: [FileQueueService, FileCleanupService, FileCleanUpProcessor],
})
export class FileCleanAppModule {}
