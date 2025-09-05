import {
    CreateMultipartUploadCommand,
    UploadPartCommand,
    CompleteMultipartUploadCommand,
    CompletedPart,
  } from '@aws-sdk/client-s3';
  import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
  import { Injectable } from '@nestjs/common';
  import { S3Service } from 'src/s3/s3.service';
  
  @Injectable()
  export class S3WriteStream {
    constructor(
      private readonly s3Service: S3Service, 
      private readonly bucket: string = 'drop-hub-storage',
    ) {}
  
    private get s3Client() {
      return this.s3Service.getClient();
    }
  
    async initMultipart(fileName: string, totalParts: number) {
      const key = `uploads/${Date.now()}_${fileName}`;
  
      const createRes = await this.s3Client.send(
        new CreateMultipartUploadCommand({ Bucket: this.bucket, Key: key }),
      );
  
      if (!createRes.UploadId) throw new Error('Cannot create multipart upload');
      const uploadId = createRes.UploadId;
  
      const presignedUrls = Object.fromEntries(
        await Promise.all(
          Array.from({ length: totalParts }, async (_, i) => {
            const partNumber = i + 1;
            const url = await getSignedUrl(
              this.s3Client,
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
      await this.s3Client.send(
        new CompleteMultipartUploadCommand({
          Bucket: this.bucket,
          Key: key,
          UploadId: uploadId,
          MultipartUpload: { Parts: parts },
        }),
      );
    }
  }
  