import { GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import { S3Client } from '@aws-sdk/client-s3';
import { MAX_DOWNLOAD_SIZE } from '../../../constants/interfaces';
import { Injectable } from '@nestjs/common';

@Injectable()
export class S3ReadStream {
  private fileSize: number | null = null;

  constructor(
    private bucket: string,
    private key: string,
    private s3Client: S3Client,
  ) {}

  private async fetchFileSize() {
    if (this.fileSize !== null) return this.fileSize;

    const head = await this.s3Client.send(
      new HeadObjectCommand({ Bucket: this.bucket, Key: this.key }),
    );

    this.fileSize = head.ContentLength ?? 0;
    return this.fileSize;
  }

  async download(): Promise<Readable | undefined> {
    const fileSize = await this.fetchFileSize();
    if (!fileSize) return;

    if (fileSize <= MAX_DOWNLOAD_SIZE) {
      const { Body } = await this.s3Client.send(
        new GetObjectCommand({ Bucket: this.bucket, Key: this.key }),
      );
      return Body as Readable;
    }

    const chunkSize = MAX_DOWNLOAD_SIZE;
    let offset = 0;

    const stream = new Readable({
      read: async () => {
        if (offset >= fileSize) {
          stream.push(null);
          return;
        }

        const end = Math.min(offset + chunkSize - 1, fileSize - 1);
        const { Body } = await this.s3Client.send(
          new GetObjectCommand({
            Bucket: this.bucket,
            Key: this.key,
            Range: `bytes=${offset}-${end}`,
          }),
        );

        for await (const chunk of Body as Readable) {
          stream.push(chunk);
        }

        offset += chunkSize;
      },
    });

    return stream;
  }
}
