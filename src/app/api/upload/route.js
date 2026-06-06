import { NextResponse } from "next/server";
import path from "path";
import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import { requireRole } from '@/lib/auth/session';

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const IMAGE_EXTENSIONS = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif"
};
const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024;

function getSafeFilename(file) {
  const extension = IMAGE_EXTENSIONS[file.type] || ".jpg";
  const baseName = path
    .basename(file.name || "image", path.extname(file.name || ""))
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, 60) || "image";

  return `${Date.now()}_${randomUUID()}_${baseName}${extension}`;
}

export async function POST(req) {
  const auth = await requireRole(req, ['seller', 'admin', 'customer']);
  if (auth.response) return auth.response;

  const data = await req.formData();
  const file = data.get("file");

  if (!file || typeof file.arrayBuffer !== "function") {
    return NextResponse.json({ success: false, error: "No file uploaded" }, { status: 400 });
  }

  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return NextResponse.json({ success: false, error: "Chỉ hỗ trợ file ảnh JPG, PNG, WEBP hoặc GIF" }, { status: 400 });
  }

  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    return NextResponse.json({ success: false, error: "Ảnh tải lên không được vượt quá 5MB" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const filename = getSafeFilename(file);
  const uploadDir = path.join(process.cwd(), "public/uploads");
  const uploadPath = path.join(uploadDir, filename);

  try {
    await mkdir(uploadDir, { recursive: true });
    await writeFile(uploadPath, buffer);
    return NextResponse.json({ success: true, url: `/uploads/${filename}` });
  } catch (error) {
    console.error("Error saving file:", error);
    return NextResponse.json({ success: false, error: "Upload failed" }, { status: 500 });
  }
}
