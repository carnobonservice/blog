import { NextResponse } from "next/server";
import { createBlogPost, getBlogPosts } from "@/app/lib/mongodbBlog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUI_ADDRESS = /^0x[0-9a-fA-F]{1,64}$/;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export async function GET(request: Request) {
    const walletAddress = new URL(request.url).searchParams.get("walletAddress");
    if (!walletAddress || !SUI_ADDRESS.test(walletAddress)) {
        return NextResponse.json({ error: "A valid wallet address is required." }, { status: 400 });
    }
    return NextResponse.json({ posts: await getBlogPosts(walletAddress) });
}

type Payload = { walletAddress?: unknown; title?: unknown; description?: unknown; content?: unknown; slug?: unknown; timestamp?: unknown };

function escapeHtml(value: string) {
    return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] ?? character);
}

export async function POST(request: Request) {
    let body: Payload;
    try { body = await request.json(); } catch { return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 }); }
    if (typeof body.walletAddress !== "string" || !SUI_ADDRESS.test(body.walletAddress) || typeof body.title !== "string" || typeof body.description !== "string" || typeof body.content !== "string" || typeof body.slug !== "string" || !SLUG.test(body.slug) || typeof body.timestamp !== "number") {
        return NextResponse.json({ error: "Invalid post payload." }, { status: 400 });
    }
    const title = body.title.trim(); const description = body.description.trim(); const content = body.content.trim();
    if (!title || !content || title.length > 160 || description.length > 500 || content.length > 50_000 || Math.abs(Date.now() - body.timestamp) > 5 * 60_000) {
        return NextResponse.json({ error: "Post content is invalid or the wallet approval has expired." }, { status: 400 });
    }
    const walletAddress = body.walletAddress.toLowerCase();
    try {
        const post = await createBlogPost({ title, description, content: escapeHtml(content).replace(/\n/g, "<br />"), slug: body.slug, authorWallet: walletAddress });
        return NextResponse.json({ post }, { status: 201 });
    } catch (error) {
        if ((error as { code?: number }).code === 11000) return NextResponse.json({ error: "That post URL already exists. Please publish again." }, { status: 409 });
        console.error("Failed to publish post:", error);
        return NextResponse.json({ error: "Unable to verify and publish this post." }, { status: 400 });
    }
}
