/**
 * Supabase Storage Provider
 *
 * Stores call recordings in Supabase Storage (managed cloud storage).
 * Uses signed URLs for time-limited secure access.
 *
 * Required env vars:
 * - SUPABASE_STORAGE_URL
 * - SUPABASE_STORAGE_SERVICE_ROLE_KEY
 * - SUPABASE_STORAGE_BUCKET
 *
 * Note: This only uses Supabase's Storage product, NOT their database or auth.
 */

import { createClient } from "@supabase/supabase-js";
import type { IStorageProvider, UploadParams, UploadResult, GetUrlOptions } from "../../types";

export class SupabaseStorageProvider implements IStorageProvider {
  readonly name = "supabase";
  private client: ReturnType<typeof createClient>;
  private bucket: string;

  constructor() {
    const url = process.env.SUPABASE_STORAGE_URL;
    const key = process.env.SUPABASE_STORAGE_SERVICE_ROLE_KEY;
    this.bucket = process.env.SUPABASE_STORAGE_BUCKET || "call-recordings";

    if (!url || !key) {
      throw new Error(
        "Supabase Storage credentials missing. Set SUPABASE_STORAGE_URL and SUPABASE_STORAGE_SERVICE_ROLE_KEY."
      );
    }

    this.client = createClient(url, key, {
      auth: {
        persistSession: false,
      },
    });
  }

  async upload(params: UploadParams): Promise<UploadResult> {
    const { data, error } = await this.client.storage
      .from(this.bucket)
      .upload(params.key, params.buffer, {
        contentType: params.contentType,
        upsert: false,
      });

    if (error) {
      throw new Error(`Supabase upload failed: ${error.message}`);
    }

    return {
      storageProvider: this.name,
      key: data.path,
    };
  }

  async getUrl(key: string, options?: GetUrlOptions): Promise<string> {
    const expiresIn = options?.expiresInSeconds || 3600; // Default 1 hour

    const { data, error } = await this.client.storage
      .from(this.bucket)
      .createSignedUrl(key, expiresIn);

    if (error) {
      throw new Error(`Failed to generate signed URL: ${error.message}`);
    }

    if (!data?.signedUrl) {
      throw new Error("No signed URL returned from Supabase");
    }

    return data.signedUrl;
  }

  async delete(key: string): Promise<void> {
    const { error } = await this.client.storage.from(this.bucket).remove([key]);

    if (error) {
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  async exists(key: string): Promise<boolean> {
    const { data, error } = await this.client.storage.from(this.bucket).list(key);

    if (error) {
      return false;
    }

    return data && data.length > 0;
  }
}
