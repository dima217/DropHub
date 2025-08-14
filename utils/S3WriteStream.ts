import {
    CreateMultipartUploadCommand,
    UploadPartCommand,
    CompleteMultipartUploadCommand,
    CompletedPart,
  } from "@aws-sdk/client-s3";
  import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
  import s3 from "../config/s3"; 
  
  export class S3WriteStream {
    private bucket: string;

    constructor(bucket: string) {
      this.bucket = bucket;
    }
  
    async initMultipart(fileName: string, totalParts: number) {
      const key = `uploads/${Date.now()}_${fileName}`;
  
      const createRes = await s3.send(
        new CreateMultipartUploadCommand({ Bucket: this.bucket, Key: key })
      );
  
      if (!createRes.UploadId) throw new Error("Cannot create multipart upload");
  
      const uploadId = createRes.UploadId;
  
      const presignedUrls = Object.fromEntries(
        await Promise.all(
          Array.from({ length: totalParts }, async (_, i) => {
            const partNumber = i + 1;
            const url = await getSignedUrl(
              s3,
              new UploadPartCommand({
                Bucket: this.bucket,
                Key: key,
                UploadId: uploadId,
                PartNumber: partNumber,
              }),
              { expiresIn: 3600 }
            );
            return [partNumber, url];
          })
        )
      );
  
      return { uploadId, key, presignedUrls };
    }

    async completeMultipart(
      key: string,
      uploadId: string,
      parts: CompletedPart[],
    ) {
      await s3.send(
        new CompleteMultipartUploadCommand({
          Bucket: this.bucket,
          Key: key,
          UploadId: uploadId,
          MultipartUpload: { Parts: parts },
        })
      );
    }
  }
  