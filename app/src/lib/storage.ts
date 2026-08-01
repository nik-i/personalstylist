import fs from "fs/promises";
import path from "path";
import sharp from "sharp";
import { randomUUID } from "crypto";

export interface StorageProvider {
  save(buffer: Buffer, mimeType: string): Promise<{ imagePath: string; thumbnailPath: string }>;
  delete(imagePath: string, thumbnailPath?: string | null): Promise<void>;
}

function extForMime(mimeType: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/heic": "heic",
  };
  return map[mimeType] ?? "jpg";
}

// ── Local (dev only) — writes to public/uploads/, served as static files ──────
class LocalStorageProvider implements StorageProvider {
  private readonly uploadDir: string;
  private readonly thumbDir: string;

  constructor() {
    this.uploadDir = path.join(process.cwd(), "public", "uploads");
    this.thumbDir = path.join(process.cwd(), "public", "uploads", "thumbs");
  }

  async save(buffer: Buffer, mimeType: string): Promise<{ imagePath: string; thumbnailPath: string }> {
    await fs.mkdir(this.uploadDir, { recursive: true });
    await fs.mkdir(this.thumbDir, { recursive: true });

    const ext = extForMime(mimeType);
    const id = randomUUID();
    const filename = `${id}.${ext}`;

    await fs.writeFile(path.join(this.uploadDir, filename), buffer);

    const thumbName = `${id}.webp`;
    await sharp(buffer)
      .resize(300, 300, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(path.join(this.thumbDir, thumbName));

    return {
      imagePath: `/uploads/${filename}`,
      thumbnailPath: `/uploads/thumbs/${thumbName}`,
    };
  }

  async delete(imagePath: string, thumbnailPath?: string | null): Promise<void> {
    const toDelete = [imagePath, thumbnailPath].filter(Boolean) as string[];
    await Promise.allSettled(
      toDelete.map((p) => fs.unlink(path.join(process.cwd(), "public", p)))
    );
  }
}

// ── Embedded (production fallback) — stores images as base64 data URLs in DB ──
// No filesystem or external service needed. The returned "paths" are data URLs
// that work directly as <img src> values. Swap for AzureBlobStorageProvider
// (or S3Provider) when persistent file storage is available.
class EmbeddedStorageProvider implements StorageProvider {
  async save(buffer: Buffer, mimeType: string): Promise<{ imagePath: string; thumbnailPath: string }> {
    const safeType = mimeType === "image/heic" ? "image/jpeg" : mimeType;

    // Full image — re-encode via sharp to strip EXIF and cap size
    const fullBuf = await sharp(buffer)
      .rotate()                          // apply EXIF orientation
      .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 82 })
      .toBuffer();

    // Thumbnail
    const thumbBuf = await sharp(buffer)
      .rotate()
      .resize(300, 300, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    return {
      imagePath: `data:${safeType};base64,${fullBuf.toString("base64")}`,
      thumbnailPath: `data:image/webp;base64,${thumbBuf.toString("base64")}`,
    };
  }

  // Nothing to delete — the data URLs are stored in the DB record itself
  async delete(_imagePath: string, _thumbnailPath?: string | null): Promise<void> {}
}

// In production (container) use EmbeddedStorageProvider so images survive in
// the DB across restarts and redeployments. In development, write to disk so
// files are browsable and don't bloat the local SQLite/Postgres DB.
// To upgrade to Azure Blob Storage: implement AzureBlobStorageProvider and
// export it here when AZURE_STORAGE_CONNECTION_STRING is set.
export const storage: StorageProvider =
  process.env.NODE_ENV === "production"
    ? new EmbeddedStorageProvider()
    : new LocalStorageProvider();
