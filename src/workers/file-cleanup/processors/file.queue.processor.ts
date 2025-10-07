import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { S3Service } from '../../../s3/s3.service.js';
import { ConfigService } from '@nestjs/config';
import { Inject } from '@nestjs/common';
import { S3_BUCKET_TOKEN } from 'src/s3/s3.tokens.js';

@Processor('file-cleanup')
export class FileCleanUpProcessor extends WorkerHost {
  constructor(
    private readonly s3Service: S3Service,
    private readonly configService: ConfigService,
    @Inject(S3_BUCKET_TOKEN) private readonly bucket: string,
  ) {
    super();
  }

  async process(job: Job<{ storedName: string }>): Promise<void> {
    const { storedName } = job.data;

    try {
      (await this.s3Service.delete({
        Bucket: this.bucket,
        Key: storedName,
      }),
        console.log(`File deleted from S3: ${storedName}`));
    } catch (err) {
      console.error(`Error deleting file from S3: ${storedName}`, err);
      throw err;
    }
  }
}
