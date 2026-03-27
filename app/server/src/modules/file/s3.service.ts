import { Injectable, Logger } from '@nestjs/common';
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

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

  /** Downloads a file from S3 and returns its content as a Buffer, or null if S3 is not configured or the key is not found. */
  public async download(key: string): Promise<Buffer | null> {
    if (!S3_BUCKET) {
      this._logger.warn('S3_BUCKET is not configured — skipping S3 download');
      return null;
    }
    try {
      const { Body } = await this._client.send(new GetObjectCommand({ Bucket: S3_BUCKET, Key: key }));
      if (!Body) { return null; }
      const bytes = await (Body as { transformToByteArray: () => Promise<Uint8Array> }).transformToByteArray();
      return Buffer.from(bytes);
    } catch (error) {
      this._logger.error(`Failed to download "${key}" from S3: ${(error as Error).message}`);
      return null;
    }
  }

  /** Deletes an object from S3. Logs an error on failure but never throws. */
  public async delete(key: string): Promise<void> {
    if (!S3_BUCKET) {
      this._logger.warn('S3_BUCKET is not configured — skipping S3 delete');
      return;
    }
    try {
      await this._client.send(new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: key }));
    } catch (error) {
      this._logger.error(`Failed to delete "${key}" from S3: ${(error as Error).message}`);
    }
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
