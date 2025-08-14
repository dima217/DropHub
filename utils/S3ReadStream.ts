import { GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { Readable } from "stream";
import s3 from "config/s3";

export class S3ReadStream {
  private bucket: string;
  private key: string;
  private fileSize: number | null = null;

  constructor(bucket: string, key: string) {
    this.bucket = bucket;
    this.key = key;
  }

  private async fetchFileSize() {
    if (this.fileSize !== null) return this.fileSize;
    const head = await s3.send(
      new HeadObjectCommand({
        Bucket: this.bucket,
        Key: this.key,
      })
    );
    this.fileSize = head.ContentLength ?? 0;
    return this.fileSize;
  }
}
