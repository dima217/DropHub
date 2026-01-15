import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { FileClientService } from 'src/modules/file-client/services/file-client.service';
import { FileQueueService } from 'src/workers/file-cleanup/services/file.queue.service';

@Injectable()
export class FileCleanupService {
  constructor(
    private readonly fileQueueService: FileQueueService,
    private readonly fileClient: FileClientService,
  ) {}

  @Cron('*/5 * * * *')
  async handleCron() {
    const expiredFiles = await this.fileClient.getExpiredFiles();
    for (const file of expiredFiles) {
      this.fileQueueService.addFileToDeleteQueue(file.storedName);
    }
  }
}
