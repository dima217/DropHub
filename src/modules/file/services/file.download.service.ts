import { BadRequestException, Injectable } from '@nestjs/common';
import { S3Service } from 'src/s3/s3.service';
import { S3ReadStream } from '../utils/s3-read-stream';
import { Readable } from 'stream';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { FilesService } from './file.service';

@Injectable()
export class FileDownloadService {
  constructor(
    private readonly s3Service: S3Service,
    private readonly bucket: string,
    private readonly s3ReadStream: S3ReadStream,
    private readonly fileService: FilesService,
  ) {
    this.bucket = process.env.S3_BUCKET ?? '';
  }

  async getDownloadLink(uploadId: string): Promise<string> {
    const file = await this.fileService.getFileByUploadId(uploadId);
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: file.key,
    });
    const url = await getSignedUrl(this.s3Service.client, command, { expiresIn: 60 });
    return url;
  }

  async getStream(key: string): Promise<Readable> {
    if (!key) {
      throw new BadRequestException('S3 key is required');
    }
    return this.s3ReadStream.download(key);
  }
}
