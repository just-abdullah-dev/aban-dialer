/**
 * Storage Provider Factory
 *
 * This is the ONLY place in the entire codebase that decides which
 * concrete storage backend gets instantiated.
 *
 * All other code calls getStorageProvider() and works with the
 * IStorageProvider interface, never importing storage SDKs directly.
 *
 * To switch storage backends:
 * 1. Set STORAGE_PROVIDER=<backend> in env vars (local | supabase | s3 | gcs)
 * 2. Provide that backend's credentials
 * 3. No code changes needed
 */

import type { IStorageProvider } from "./types";
import { LocalStorageProvider } from "./providers/local/local-storage-provider";

/**
 * Returns the configured storage provider instance
 * Reads from STORAGE_PROVIDER environment variable
 *
 * @throws Error if provider is unknown or required env vars are missing
 */
export function getStorageProvider(): IStorageProvider {
  const backend = process.env.STORAGE_PROVIDER ?? "local";

  switch (backend.toLowerCase()) {
    case "local":
      return new LocalStorageProvider();

    case "supabase":
      // Lazy import to avoid loading SDK unless actually used
      const { SupabaseStorageProvider } = require("./providers/supabase/supabase-storage-provider");
      return new SupabaseStorageProvider();

    case "s3":
      const { S3StorageProvider } = require("./providers/s3/s3-storage-provider");
      return new S3StorageProvider();

    case "gcs":
      const { GcsStorageProvider } = require("./providers/gcs/gcs-storage-provider");
      return new GcsStorageProvider();

    default:
      throw new Error(
        `Unknown storage provider: "${backend}". ` +
        `Supported providers: local, supabase, s3, gcs. ` +
        `Set STORAGE_PROVIDER environment variable to a supported provider.`
      );
  }
}
