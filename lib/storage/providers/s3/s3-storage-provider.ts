/**
 * AWS S3 Storage Provider
 *
 * Stores call recordings in Amazon S3.
 * Uses presigned URLs for time-limited secure access.
 *
 * Required env vars:
 * - AWS_S3_BUCKET
 * - AWS_S3_REGION
 * - AWS_ACCESS_KEY_ID
 * - AWS_SECRET_ACCESS_KEY
 *
 * Will be implemented when needed. For now, this is a placeholder.
 */

import type { IStorageProvider, UploadParams, UploadResult, GetUrlOptions } from "../../types";

export class S3StorageProvider implements IStorageProvider {
  readonly name = "s3";

  constructor() {
    // TODO: Initialize S3 client when this provider is actually used
    throw new Error(
      "S3 storage provider not yet implemented. " +
      "Install @aws-sdk/client-s3 and @aws-sdk/s3-request-presigner, then implement this class."
    );
  }

  async upload(params: UploadParams): Promise<UploadResult> {
    throw new Error("Not implemented");
  }

  async getUrl(key: string, options?: GetUrlOptions): Promise<string> {
    throw new Error("Not implemented");
  }

  async delete(key: string): Promise<void> {
    throw new Error("Not implemented");
  }

  async exists(key: string): Promise<boolean> {
    throw new Error("Not implemented");
  }
}
