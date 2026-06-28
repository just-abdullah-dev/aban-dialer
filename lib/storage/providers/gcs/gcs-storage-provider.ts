/**
 * Google Cloud Storage Provider
 *
 * Stores call recordings in Google Cloud Storage.
 * Uses signed URLs for time-limited secure access.
 *
 * Required env vars:
 * - GCS_BUCKET
 * - GCS_PROJECT_ID
 * - GCS_CLIENT_EMAIL
 * - GCS_PRIVATE_KEY
 *
 * Will be implemented when needed. For now, this is a placeholder.
 */

import type { IStorageProvider, UploadParams, UploadResult, GetUrlOptions } from "../../types";

export class GcsStorageProvider implements IStorageProvider {
  readonly name = "gcs";

  constructor() {
    // TODO: Initialize GCS client when this provider is actually used
    throw new Error(
      "GCS storage provider not yet implemented. " +
      "Install @google-cloud/storage, then implement this class."
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
