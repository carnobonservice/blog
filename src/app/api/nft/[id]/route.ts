import { NextResponse } from "next/server";
import { getNftById } from "@/app/lib/mongodbNft";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: RouteContext<"/api/nft/[id]">) {
  try {
    const { id } = await params;
    const nft = await getNftById(id);
    if (!nft) return NextResponse.json({ error: "NFT not found." }, { status: 404 });
    return NextResponse.json({ nft });
  } catch (error) {
    console.error("Failed to load NFT:", error);
    return NextResponse.json({ error: "Unable to load this NFT right now." }, { status: 500 });
  }
}
