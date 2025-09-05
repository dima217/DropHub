import { Injectable, OnModuleInit } from '@nestjs/common';
import { S3Client, ListBucketsCommand, Bucket } from '@aws-sdk/client-s3';
import { NodeHttpHandler } from '@smithy/node-http-handler';
import https from 'https';

@Injectable()
export class S3Service implements OnModuleInit {
  private s3: S3Client;

  onModuleInit() {
    const agent = new https.Agent({ maxSockets: 50 });

    this.s3 = new S3Client({
      region: 'fra3',
      endpoint: process.env.S3_ENDPOINT,
      forcePathStyle: true,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY ?? '',
        secretAccessKey: process.env.S3_SECRET_KEY ?? '',
      },
      requestHandler: new NodeHttpHandler({
        requestTimeout: 5000,
        httpsAgent: agent,
      }),
    });
  }

  async listBuckets(): Promise<Bucket[] | undefined> {
    try {
      const data = await this.s3.send(new ListBucketsCommand({}));
      return data.Buckets;
    } catch (error) {
      throw new Error(`Failed to list buckets: ${(error as Error).message}`);
    }
  }

  getClient(): S3Client {
    return this.s3;
  }
}
