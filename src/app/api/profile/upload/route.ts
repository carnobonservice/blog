import { v2 as cloudinary } from "cloudinary";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: "A file is required." }, { status: 400 });
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (!cloudName) {
    return NextResponse.json({ error: "Cloudinary cloud name is not configured." }, { status: 500 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const base64 = buffer.toString("base64");
  const dataUri = `data:${file.type || "image/jpeg"};base64,${base64}`;

  try {
    const result = await cloudinary.uploader.upload(dataUri, { folder: "gather/profile" });
    return NextResponse.json({ secureUrl: result.secure_url, publicId: result.public_id });
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    const message = (error && (error as any).message) || "Image upload failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
