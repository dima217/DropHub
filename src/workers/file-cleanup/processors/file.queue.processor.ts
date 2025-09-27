import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { S3Service } from '../../../s3/s3.service.js';

@Processor('file-cleanup')
export class FileCleanUpProcessor extends WorkerHost {
  constructor(private readonly s3Service: S3Service) {
    super();
  }

  async process(job: Job<{ storedName: string }>): Promise<void> {
    const { storedName } = job.data;

    try {
      await this.s3Service.client.send(
        new DeleteObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET as string,
          Key: storedName,
        }),
      );

      console.log(`File deleted from S3: ${storedName}`);
    } catch (err) {
      console.error(`Error deleting file from S3: ${storedName}`, err);
      throw err;
    }
  }
}
