/**
 * Local File System Storage Provider
 *
 * Stores call recordings on the local file system.
 * Good for development, but NOT recommended for production on serverless
 * platforms like Vercel (ephemeral filesystem).
 *
 * Files are stored in LOCAL_STORAGE_PATH (default: ./storage/recordings)
 * and served via /api/files/[key] route.
 */

import { promises as fs } from "fs";
import path from "path";
import type { IStorageProvider, UploadParams, UploadResult } from "../../types";

export class LocalStorageProvider implements IStorageProvider {
  readonly name = "local";
  private storagePath: string;

  constructor() {
    this.storagePath = process.env.LOCAL_STORAGE_PATH || "./storage/recordings";
  }

  /**
   * Uploads a file to the local filesystem
   */
  async upload(params: UploadParams): Promise<UploadResult> {
    // Ensure storage directory exists
    await this.ensureDirectoryExists(this.storagePath);

    // Sanitize key to prevent directory traversal
    const sanitizedKey = this.sanitizeKey(params.key);
    const fullPath = path.join(this.storagePath, sanitizedKey);

    // Ensure parent directory exists
    const dir = path.dirname(fullPath);
    await this.ensureDirectoryExists(dir);

    // Write file
    await fs.writeFile(fullPath, params.buffer);

    return {
      storageProvider: this.name,
      key: sanitizedKey,
    };
  }

  /**
   * Returns a URL to access the file
   * For local storage, this is a route like /api/files/[key]
   */
  async getUrl(key: string): Promise<string> {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const sanitizedKey = this.sanitizeKey(key);

    // Check if file exists
    const fullPath = path.join(this.storagePath, sanitizedKey);
    try {
      await fs.access(fullPath);
    } catch {
      throw new Error(`File not found: ${key}`);
    }

    // Return API route that will stream the file
    return `${appUrl}/api/files/${encodeURIComponent(sanitizedKey)}`;
  }

  /**
   * Deletes a file from local storage
   */
  async delete(key: string): Promise<void> {
    const sanitizedKey = this.sanitizeKey(key);
    const fullPath = path.join(this.storagePath, sanitizedKey);

    try {
      await fs.unlink(fullPath);
    } catch (error) {
      // Ignore if file doesn't exist
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        throw error;
      }
    }
  }

  /**
   * Checks if a file exists
   */
  async exists(key: string): Promise<boolean> {
    const sanitizedKey = this.sanitizeKey(key);
    const fullPath = path.join(this.storagePath, sanitizedKey);

    try {
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Helper: Read file from disk (used by API route)
   */
  async readFile(key: string): Promise<Buffer> {
    const sanitizedKey = this.sanitizeKey(key);
    const fullPath = path.join(this.storagePath, sanitizedKey);
    return await fs.readFile(fullPath);
  }

  /**
   * Ensures a directory exists, creating it if necessary
   */
  private async ensureDirectoryExists(dir: string): Promise<void> {
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (error) {
      // Ignore if already exists
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") {
        throw error;
      }
    }
  }

  /**
   * Sanitizes a storage key to prevent directory traversal attacks
   */
  private sanitizeKey(key: string): string {
    // Remove any ../ or .\ sequences
    let sanitized = key.replace(/\.\.[/\\]/g, "");

    // Remove leading slashes
    sanitized = sanitized.replace(/^[/\\]+/, "");

    // Normalize path separators
    sanitized = sanitized.replace(/\\/g, "/");

    return sanitized;
  }
}
