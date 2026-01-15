import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { FileClientService } from 'src/modules/file-client/services/file-client.service';

@Processor('file-cleanup')
export class FileCleanUpProcessor extends WorkerHost {
  constructor(private readonly fileClient: FileClientService) {
    super();
  }

  async process(job: Job<{ storedName: string }>): Promise<void> {
    const { storedName } = job.data;

    try {
      // Полное удаление файла: из S3, из всех комнат и из БД
      await this.fileClient.deleteFileCompletely(storedName);
      console.log(`File cleanup completed: ${storedName}`);
    } catch (err) {
      console.error(`Error deleting file: ${storedName}`, err);
      throw err;
    }
  }
}
