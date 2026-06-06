import path from "path";
import { randomUUID } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";

export const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
export const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024;

const IMAGE_EXTENSIONS = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif"
};

function getSafeFilename(file) {
  const extension = IMAGE_EXTENSIONS[file.type] || ".jpg";
  const baseName = path
    .basename(file.name || "image", path.extname(file.name || ""))
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, 60) || "image";

  return `${Date.now()}_${randomUUID()}_${baseName}${extension}`;
}

export function getImageUploadError(file) {
  if (!file || typeof file.arrayBuffer !== "function") {
    return "No file uploaded";
  }

  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return "Chỉ hỗ trợ file ảnh JPG, PNG, WEBP hoặc GIF";
  }

  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    return "Ảnh tải lên không được vượt quá 5MB";
  }

  return "";
}

export async function saveUploadedImage(file) {
  const error = getImageUploadError(file);
  if (error) {
    return { error };
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const filename = getSafeFilename(file);
  const uploadDir = path.join(process.cwd(), "public/uploads");
  const uploadPath = path.join(uploadDir, filename);

  await mkdir(uploadDir, { recursive: true });
  await writeFile(uploadPath, buffer);

  return {
    path: uploadPath,
    url: `/uploads/${filename}`
  };
}

export async function removeUploadedImages(images = []) {
  await Promise.all(images.map(async (image) => {
    if (!image?.path) return;

    try {
      await unlink(image.path);
    } catch {
      // Best-effort cleanup for files saved during the failed request.
    }
  }));
}
