import { Injectable } from '@nestjs/common';
import { S3Service } from 'src/s3/s3.service';
import { S3ReadStream } from '../utils/s3-read-stream';
import { Readable } from 'stream';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class FileDownloadService {
  constructor(
    private readonly s3Service: S3Service,
    private readonly bucket: string,
  ) {
    this.bucket = process.env.S3_BUCKET ?? '';
  }

  private get s3Client() {
    return this.s3Service.getClient();
  }

  async getDownloadLink(key: string, expiresIn = 60): Promise<string> {
    if (!key) throw new Error('S3 key is required');
    const command = new GetObjectCommand({ 
        Bucket: this.bucket, Key: key 
    });
    const url = await getSignedUrl(this.s3Client, command, {expiresIn: 60});
    return url;
  }

  async getStream(key: string): Promise<Readable | undefined> {
    const reader = new S3ReadStream(this.bucket, key, this.s3Service.getClient());
    return reader.download();
  }
}
