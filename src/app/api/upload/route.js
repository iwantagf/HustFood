import { NextResponse } from "next/server";
import path from "path";
import { writeFile } from "fs/promises";

export async function POST(req) {
  const data = await req.formData();
  const file = data.get("file");

  if (!file) {
    return NextResponse.json({ success: false, error: "No file uploaded" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Generate unique filename
  const filename = Date.now() + "_" + file.name.replace(/[^a-zA-Z0-9.]/g, "");
  const uploadPath = path.join(process.cwd(), "public/uploads", filename);

  try {
    await writeFile(uploadPath, buffer);
    return NextResponse.json({ success: true, url: `/uploads/${filename}` });
  } catch (error) {
    console.error("Error saving file:", error);
    return NextResponse.json({ success: false, error: "Upload failed" }, { status: 500 });
  }
}
