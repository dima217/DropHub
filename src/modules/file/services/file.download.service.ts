import { Injectable } from '@nestjs/common';
import { S3Service } from 'src/s3/s3.service';
import { S3ReadStream } from '../utils/s3-read-stream';
import { Readable } from 'stream';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class S3ReadService {
  constructor(private readonly s3Service: S3Service) {}

  private get s3Client() {
    return this.s3Service.getClient();
  }

  async getDownloadLink(bucket: string, key: string, expiresIn = 60): Promise<string> {
    if (!key) throw new Error('S3 key is required');
    const command = new GetObjectCommand({ 
        Bucket: bucket, Key: key 
    });
    const url = await getSignedUrl(this.s3Client, command, {expiresIn: 60});
    return url;
  }

  async getStream(bucket: string, key: string): Promise<Readable | undefined> {
    const reader = new S3ReadStream(bucket, key, this.s3Service.getClient());
    return reader.download();
  }
}
