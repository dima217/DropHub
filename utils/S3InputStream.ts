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
  import { Readable } from "stream";
  import s3 from "../config/s3"; 
  
  export class S3Chunked {
    private bucket: string;
    private key: string;
    private fileSize: number | null = null;
    private offset = 0;
    private bufferSize: number;
  
    constructor(bucket: string, key: string, bufferSize = 64 * 1024) {
      this.bucket = bucket;
      this.key = key;
      this.bufferSize = bufferSize;
    }
  
    private async fetchFileSize(): Promise<void> {
      const head = await s3.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: this.key
        })
      );
      this.fileSize = head.ContentLength ?? null;
    }
  
    public async readChunk(): Promise<Buffer | null> {
      if (this.fileSize === null) {
        await this.fetchFileSize();
      }
      if (this.fileSize === null || this.offset >= this.fileSize) {
        return null; 
      }
  
      const end = Math.min(
        this.offset + this.bufferSize - 1,
        (this.fileSize ?? 0) - 1
      );
  
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: this.key,
        Range: `bytes=${this.offset}-${end}`
      });
  
      const response: GetObjectCommandOutput = await s3.send(command);
  
      if (!response.Body) return null;
  
      const chunks: Buffer[] = [];
      for await (const chunk of response.Body as AsyncIterable<Buffer>) {
        chunks.push(chunk);
      }
  
      const buffer = Buffer.concat(chunks);
      this.offset += buffer.length;
      return buffer;
    }
  
    public async uploadInChunks(source: Readable): Promise<void> {
      const createRes = await s3.send(
        new CreateMultipartUploadCommand({
          Bucket: this.bucket,
          Key: this.key
        })
      );
  
      if (!createRes.UploadId) throw new Error("Error while creating multipart upload");
  
      const uploadId = createRes.UploadId;
      const parts: CompletedPart[] = [];
  
      let partNumber = 1;
      let buffer = Buffer.alloc(0);
  
      for await (const chunk of source) {
        buffer = Buffer.concat([buffer, chunk as Buffer]);
  
        if (buffer.length >= this.bufferSize) {
          const partRes = await s3.send(
            new UploadPartCommand({
              Bucket: this.bucket,
              Key: this.key,
              UploadId: uploadId,
              PartNumber: partNumber,
              Body: buffer
            })
          );
  
          if (!partRes.ETag) throw new Error(`Error occurred while uploading part: ${partNumber}`);
  
          parts.push({ ETag: partRes.ETag, PartNumber: partNumber });
          console.log(`Uploaded part #${partNumber}, size ${buffer.length}`);
          partNumber++;
          buffer = Buffer.alloc(0);
        }
      }
  
      if (buffer.length > 0) {
        const partRes = await s3.send(
          new UploadPartCommand({
            Bucket: this.bucket,
            Key: this.key,
            UploadId: uploadId,
            PartNumber: partNumber,
            Body: buffer
          })
        );
  
        if (!partRes.ETag) throw new Error(`Error while uploading last part ${partNumber}`);
  
        parts.push({ ETag: partRes.ETag, PartNumber: partNumber });
        console.log(`Uploaded last part: #${partNumber}, size ${buffer.length}`);
      }
  
      await s3.send(
        new CompleteMultipartUploadCommand({
          Bucket: this.bucket,
          Key: this.key,
          UploadId: uploadId,
          MultipartUpload: { Parts: parts }
        })
      );
  
      console.log("File uploaded successfully");
    }
  }
  