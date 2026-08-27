import { v2 as cloudinary } from "cloudinary";
import { NextResponse } from "next/server";
import { createImage, getImagesByOwner } from "@/app/lib/mongodbImage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUI_ADDRESS = /^0x[0-9a-fA-F]{1,64}$/;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const walletAddress = searchParams.get("walletAddress");

  if (typeof walletAddress !== "string" || !SUI_ADDRESS.test(walletAddress)) {
    return NextResponse.json({ error: "A valid Sui wallet address is required." }, { status: 400 });
  }

  try {
    const images = await getImagesByOwner(walletAddress.toLowerCase());
    return NextResponse.json({ images });
  } catch (error) {
    console.error("Failed to list user images:", error);
    return NextResponse.json({ error: "Unable to list your images right now." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");
  const walletAddress = formData.get("walletAddress");

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
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: typeof walletAddress === "string" && SUI_ADDRESS.test(walletAddress)
        ? "gather/nft"
        : "gather/profile",
    });

    // Persist the image to the user's gallery when a wallet address is provided,
    // so it can be reused later (e.g. choosing an image for an NFT mint).
    const image =
      typeof walletAddress === "string" && SUI_ADDRESS.test(walletAddress)
        ? await createImage(walletAddress.toLowerCase(), result.secure_url, result.public_id)
        : null;

    return NextResponse.json({
      secureUrl: result.secure_url,
      publicId: result.public_id,
      image: image
        ? { url: image.url, id: image.id, owner: image.owner }
        : undefined,
    });
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    const message =
      (error && typeof error === "object" && "message" in error
        ? String(error.message)
        : undefined) || "Image upload failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}