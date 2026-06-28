/**
 * File Storage Provider Abstraction Layer
 *
 * This file defines the contract that ALL storage providers must implement.
 * Local disk, Supabase Storage, AWS S3, GCP Cloud Storage all hide behind this interface.
 *
 * CRITICAL: No code outside lib/storage/providers/<backend>/ should ever
 * import storage-specific SDKs (@supabase/supabase-js, @aws-sdk, @google-cloud/storage, fs)
 * directly. Everything goes through these interfaces.
 *
 * Why this exists: Call recordings need to be stored somewhere persistent.
 * The operator wants the freedom to start with local disk (dev), move to
 * Supabase Storage (easy managed solution), or switch to S3/GCS (scale/cost)
 * without rewriting application code.
 */

export interface UploadParams {
  /** Storage key/path (e.g., "recordings/call-123.mp3") */
  key: string;
  /** File content as Buffer */
  buffer: Buffer;
  /** MIME type (e.g., "audio/mpeg", "audio/wav") */
  contentType: string;
  /** Optional metadata */
  metadata?: Record<string, string>;
}

export interface UploadResult {
  /** Which storage backend was used ("local" | "supabase" | "s3" | "gcs") */
  storageProvider: string;
  /** The key used to store the file (may be normalized by backend) */
  key: string;
}

export interface GetUrlOptions {
  /** For backends that support signed URLs, how long until expiry */
  expiresInSeconds?: number;
}

/**
 * Main storage provider interface
 * Every storage backend must implement this
 */
export interface IStorageProvider {
  /** Provider name used in DB records (e.g., "local", "supabase", "s3", "gcs") */
  readonly name: string;

  /**
   * Uploads a file to storage
   *
   * @param params Upload parameters (key, buffer, content type)
   * @returns Upload result with actual key used
   */
  upload(params: UploadParams): Promise<UploadResult>;

  /**
   * Resolves a playable/downloadable URL for a stored file
   *
   * - For cloud backends: should return a signed/time-limited URL
   * - For local: returns a route like /api/files/[key] that streams from disk
   *
   * @param key Storage key from previous upload
   * @param options Optional parameters (e.g., expiry time)
   * @returns Publicly accessible URL
   */
  getUrl(key: string, options?: GetUrlOptions): Promise<string>;

  /**
   * Deletes a file from storage
   * Used for cleanup, retention policies, or user-initiated deletion
   *
   * @param key Storage key to delete
   */
  delete(key: string): Promise<void>;

  /**
   * Checks if a file exists
   *
   * @param key Storage key to check
   * @returns true if file exists, false otherwise
   */
  exists(key: string): Promise<boolean>;
}
