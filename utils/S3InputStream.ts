import {
    GetObjectCommand,
    HeadObjectCommand,
    GetObjectCommandOutput,
    CreateMultipartUploadCommand,
    UploadPartCommand,
    CompleteMultipartUploadCommand,
    CompletedPart,
    PutObjectCommand
  } from "@aws-sdk/client-s3";
  import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
  import { Readable } from "stream";
  import s3 from "../config/s3"; 
  
  export class S3WriteStream {
    private bucket: string;
    //private key: string;

    constructor(bucket: string) {
      this.bucket = bucket;
      //this.key = key;
    }
  
    /* private async fetchFileSize(): Promise<number | null> {
      const head = await s3.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: this.key
        })
      );
      return head.ContentLength ?? null;
    } */
  
    async initMultipart(fileName: string, totalParts: number) {
      const key = `uploads/${Date.now()}_${fileName}`;
  
      const createRes = await s3.send(
        new CreateMultipartUploadCommand({ Bucket: this.bucket, Key: key })
      );
  
      if (!createRes.UploadId) throw new Error("Cannot create multipart upload");
  
      const uploadId = createRes.UploadId;
      const presignedUrls: Record<number, string> = {};
  
      for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
        presignedUrls[partNumber] = await getSignedUrl(
          s3,
          new UploadPartCommand({
            Bucket: this.bucket,
            Key: key,
            UploadId: uploadId,
            PartNumber: partNumber,
          }),
          { expiresIn: 3600 }
        );
      }
  
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
  