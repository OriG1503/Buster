import { Injectable } from '@nestjs/common';
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { LoggerService } from '../../shared/services/logger/logger.service';

@Injectable()
export class S3Service {
  private readonly _client: S3Client;
  private readonly _bucket: string | undefined;

  public constructor(private readonly _logger: LoggerService) {
    this._bucket = process.env.S3_BUCKET;
    this._client = new S3Client({
      region: process.env.S3_REGION ?? 'us-east-1',
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID ?? '',
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? '',
      },
    });
  }

  /** Downloads a file from S3 and returns its content as a Buffer, or null if S3 is not configured or the key is not found. */
  public async download(key: string): Promise<Buffer | null> {
    if (!this._bucket) {
      //LOG
      this._logger.warn(
        `S3Service.download — S3_BUCKET not configured, skipping download for key "${key}"`,
        'app-workflow',
      );
      return null;
    }
    try {
      //LOG
      this._logger.info(`S3Service.download — fetching key "${key}" from bucket "${this._bucket}"`, 'app-workflow');
      const { Body } = await this._client.send(new GetObjectCommand({ Bucket: this._bucket, Key: key }));
      if (!Body) {
        //LOG
        this._logger.warn(`S3Service.download — empty body for key "${key}"`, 'app-workflow');
        return null;
      }
      const bytes = await (Body as { transformToByteArray: () => Promise<Uint8Array> }).transformToByteArray();
      //LOG
      this._logger.info(`S3Service.download — fetched ${bytes.length} bytes for key "${key}"`, 'app-workflow');
      return Buffer.from(bytes);
    } catch (error) {
      //LOG
      this._logger.error(`S3Service.download — failed for key "${key}": ${(error as Error).message}`, 'app-workflow');
      return null;
    }
  }

  /** Deletes an object from S3. Logs an error on failure but never throws. */
  public async delete(key: string): Promise<void> {
    if (!this._bucket) {
      //LOG
      this._logger.warn(
        `S3Service.delete — S3_BUCKET not configured, skipping delete for key "${key}"`,
        'app-workflow',
      );
      return;
    }
    try {
      //LOG
      this._logger.info(`S3Service.delete — deleting key "${key}" from bucket "${this._bucket}"`, 'app-workflow');
      await this._client.send(new DeleteObjectCommand({ Bucket: this._bucket, Key: key }));
      //LOG
      this._logger.info(`S3Service.delete — deleted key "${key}"`, 'app-workflow');
    } catch (error) {
      //LOG
      this._logger.error(`S3Service.delete — failed for key "${key}": ${(error as Error).message}`, 'app-workflow');
    }
  }

  /** Uploads a buffer to S3. Logs an error on failure but never throws. */
  public async upload(key: string, buffer: Buffer, contentType = 'application/octet-stream'): Promise<void> {
    if (!this._bucket) {
      //LOG
      this._logger.warn(
        `S3Service.upload — S3_BUCKET not configured, skipping upload for key "${key}"`,
        'app-workflow',
      );
      return;
    }
    try {
      //LOG
      this._logger.info(
        `S3Service.upload — uploading ${buffer.length} bytes to key "${key}" (contentType "${contentType}")`,
        'app-workflow',
      );
      await this._client.send(
        new PutObjectCommand({ Bucket: this._bucket, Key: key, Body: buffer, ContentType: contentType }),
      );
      //LOG
      this._logger.info(`S3Service.upload — upload complete for key "${key}"`, 'app-workflow');
    } catch (error) {
      //LOG
      this._logger.error(`S3Service.upload — failed for key "${key}": ${(error as Error).message}`, 'app-workflow');
    }
  }
}
