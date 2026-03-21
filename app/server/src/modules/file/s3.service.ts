import { Injectable, Logger } from '@nestjs/common';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

const S3_BUCKET = process.env.S3_BUCKET;
const S3_REGION = process.env.S3_REGION ?? 'us-east-1';

@Injectable()
export class S3Service {
  private readonly _logger = new Logger(S3Service.name);
  private readonly _client: S3Client;

  public constructor() {
    this._client = new S3Client({
      region: S3_REGION,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID ?? '',
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? '',
      },
    });
  }

  /** Uploads a buffer to S3. Logs an error on failure but never throws. */
  public async upload(key: string, buffer: Buffer, contentType = 'application/octet-stream'): Promise<void> {
    if (!S3_BUCKET) {
      this._logger.warn('S3_BUCKET is not configured — skipping S3 upload');
      return;
    }
    try {
      await this._client.send(
        new PutObjectCommand({ Bucket: S3_BUCKET, Key: key, Body: buffer, ContentType: contentType }),
      );
    } catch (error) {
      this._logger.error(`Failed to upload "${key}" to S3: ${(error as Error).message}`);
    }
  }
}
