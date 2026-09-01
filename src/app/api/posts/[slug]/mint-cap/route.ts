import { NextResponse } from "next/server";
import { verifyPersonalMessageSignature } from "@mysten/sui/verify";
import { attachPostMintCap } from "@/app/lib/mongodbBlog";

export const runtime = "nodejs";
const SUI_ADDRESS = /^0x[0-9a-fA-F]{1,64}$/;
const OBJECT_ID = /^0x[0-9a-fA-F]{1,64}$/;

export async function POST(request: Request, { params }: RouteContext<"/api/posts/[slug]/mint-cap">) {
    const { slug } = await params;
    let body: { walletAddress?: unknown; postMintCapId?: unknown; timestamp?: unknown; signature?: unknown };
    try { body = await request.json(); } catch { return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 }); }
    if (typeof body.walletAddress !== "string" || !SUI_ADDRESS.test(body.walletAddress) || typeof body.postMintCapId !== "string" || !OBJECT_ID.test(body.postMintCapId) || typeof body.timestamp !== "number" || typeof body.signature !== "string" || Math.abs(Date.now() - body.timestamp) > 5 * 60_000) return NextResponse.json({ error: "Invalid or expired mint authorization." }, { status: 400 });
    const walletAddress = body.walletAddress.toLowerCase();
    const message = `Gather link post mint cap\nwallet:${walletAddress}\nslug:${slug}\ncap:${body.postMintCapId}\ntimestamp:${body.timestamp}`;
    try {
        await verifyPersonalMessageSignature(new TextEncoder().encode(message), body.signature, { address: walletAddress });
        const post = await attachPostMintCap(slug, walletAddress, body.postMintCapId);
        if (!post) return NextResponse.json({ error: "Post not found, not owned by this wallet, or already authorized." }, { status: 409 });
        return NextResponse.json({ post });
    } catch (error) {
        console.error("Failed to link mint authorization:", error);
        return NextResponse.json({ error: "Unable to verify the mint authorization." }, { status: 400 });
    }
}
