import { NextResponse } from "next/server";
import { verifyPersonalMessageSignature } from "@mysten/sui/verify";
import { createBlogPost } from "@/app/lib/mongodbBlog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUI_ADDRESS = /^0x[0-9a-fA-F]{1,64}$/;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

type Payload = { walletAddress?: unknown; title?: unknown; description?: unknown; content?: unknown; slug?: unknown; timestamp?: unknown; signature?: unknown };

function message(input: { walletAddress: string; title: string; description: string; content: string; slug: string; timestamp: number }) {
    return `Gather create post\nwallet:${input.walletAddress.toLowerCase()}\nslug:${input.slug}\ntitle:${input.title}\ndescription:${input.description}\ncontent:${input.content}\ntimestamp:${input.timestamp}`;
}

function escapeHtml(value: string) {
    return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] ?? character);
}

export async function POST(request: Request) {
    let body: Payload;
    try { body = await request.json(); } catch { return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 }); }
    if (typeof body.walletAddress !== "string" || !SUI_ADDRESS.test(body.walletAddress) || typeof body.title !== "string" || typeof body.description !== "string" || typeof body.content !== "string" || typeof body.slug !== "string" || !SLUG.test(body.slug) || typeof body.timestamp !== "number" || typeof body.signature !== "string") {
        return NextResponse.json({ error: "Invalid post payload." }, { status: 400 });
    }
    const title = body.title.trim(); const description = body.description.trim(); const content = body.content.trim();
    if (!title || !content || title.length > 160 || description.length > 500 || content.length > 50_000 || Math.abs(Date.now() - body.timestamp) > 5 * 60_000) {
        return NextResponse.json({ error: "Post content is invalid or the wallet approval has expired." }, { status: 400 });
    }
    const walletAddress = body.walletAddress.toLowerCase();
    try {
        await verifyPersonalMessageSignature(new TextEncoder().encode(message({ walletAddress, title, description, content, slug: body.slug, timestamp: body.timestamp })), body.signature, { address: walletAddress });
        const post = await createBlogPost({ title, description, content: escapeHtml(content).replace(/\n/g, "<br />"), slug: body.slug, authorWallet: walletAddress });
        return NextResponse.json({ post }, { status: 201 });
    } catch (error) {
        if ((error as { code?: number }).code === 11000) return NextResponse.json({ error: "That post URL already exists. Please publish again." }, { status: 409 });
        console.error("Failed to publish post:", error);
        return NextResponse.json({ error: "Unable to verify and publish this post." }, { status: 400 });
    }
}
