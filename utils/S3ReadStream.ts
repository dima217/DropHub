import { GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { Readable } from "stream";
import s3 from "config/s3";
import { MAX_DOWNLOAD_SIZE } from "constants/constants";

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

  public async download(): Promise<Readable | undefined> {
    await this.fetchFileSize();
    if (!this.fileSize) return;

    if (this.fileSize < MAX_DOWNLOAD_SIZE) {
      const { Body } = await s3.send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: this.key,
        })
      );
      return Body as Readable;
    }

    const chunkSize = MAX_DOWNLOAD_SIZE;
    const totalSize = this.fileSize;
    let offset = 0;

    const stream = new Readable({
      read: async () => {
        if (offset >= totalSize) {
          stream.push(null); 
          return;
        }

        const end = Math.min(offset + chunkSize - 1, totalSize - 1);
        const { Body } = await s3.send(
          new GetObjectCommand({
            Bucket: this.bucket,
            Key: this.key,
            Range: `bytes=${offset}-${end}`,
          })
        );
        
        for await (const chunk of Body as Readable) {
          stream.push(chunk);
        }

        offset += chunkSize;
      },
    });

    return stream;
  }
}
