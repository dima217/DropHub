import {
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  CompletedPart,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable, Inject } from '@nestjs/common';
import { S3Service } from '../../s3/s3.service';
import { S3_BUCKET_TOKEN } from '../../s3/s3.tokens';

@Injectable()
export class S3WriteStream {
  constructor(
    private readonly s3Service: S3Service,
    @Inject(S3_BUCKET_TOKEN) private readonly bucket: string,
  ) {}

  async initMultipart(fileName: string, totalParts: number) {
    const key = `uploads/${Date.now()}_${fileName}`;

    const createRes = await this.s3Service.client.send(
      new CreateMultipartUploadCommand({ Bucket: this.bucket, Key: key }),
    );

    if (!createRes.UploadId) throw new Error('Cannot create multipart upload');
    const uploadId = createRes.UploadId;

    const presignedUrls = Object.fromEntries(
      await Promise.all(
        Array.from({ length: totalParts }, async (_, i) => {
          const partNumber = i + 1;
          const url = await getSignedUrl(
            this.s3Service.client,
            new UploadPartCommand({
              Bucket: this.bucket,
              Key: key,
              UploadId: uploadId,
              PartNumber: partNumber,
            }),
            { expiresIn: 3600 },
          );
          return [partNumber, url];
        }),
      ),
    );

    return { uploadId, key, presignedUrls };
  }

  async completeMultipart(key: string, uploadId: string, parts: CompletedPart[]) {
    await this.s3Service.client.send(
      new CompleteMultipartUploadCommand({
        Bucket: this.bucket,
        Key: key,
        UploadId: uploadId,
        MultipartUpload: { Parts: parts },
      }),
    );
  }
}

