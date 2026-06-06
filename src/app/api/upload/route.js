import { NextResponse } from "next/server";
import { requireRole } from '@/lib/auth/session';
import { getImageUploadError, saveUploadedImage } from '@/lib/uploads';

export async function POST(req) {
  const auth = await requireRole(req, ['seller', 'admin']);
  if (auth.response) return auth.response;

  const data = await req.formData();
  const file = data.get("file");

  const uploadError = getImageUploadError(file);
  if (uploadError) {
    return NextResponse.json({ success: false, error: uploadError }, { status: 400 });
  }

  try {
    const uploadedImage = await saveUploadedImage(file);
    return NextResponse.json({ success: true, url: uploadedImage.url });
  } catch (error) {
    console.error("Error saving file:", error);
    return NextResponse.json({ success: false, error: "Upload failed" }, { status: 500 });
  }
}
