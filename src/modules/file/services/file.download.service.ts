import { BadRequestException, Injectable } from '@nestjs/common';
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
    private readonly s3ReadStream: S3ReadStream,
  ) {
    this.bucket = process.env.S3_BUCKET ?? '';
  }

  async getDownloadLink(key: string, expiresIn = 60): Promise<string> {
    if (!key) throw new BadRequestException('S3 key is required');
    const command = new GetObjectCommand({ 
        Bucket: this.bucket, Key: key 
    });
    const url = await getSignedUrl(this.s3Service.client, command, {expiresIn: 60});
    return url;
  }

  async getStream(key: string): Promise<Readable> {
    if (!key) {
      throw new BadRequestException('S3 key is required')
    }
    return this.s3ReadStream.download(key);
  }
}
