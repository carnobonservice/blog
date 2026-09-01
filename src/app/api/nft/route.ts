import { NextResponse } from "next/server";
import { createNft, getNftsByOwner } from "@/app/lib/mongodbNft";
import { getBlogPostBySlug } from "@/app/lib/mongodbBlog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUI_ADDRESS = /^0x[0-9a-fA-F]{1,64}$/;

type NftPayload = {
    walletAddress?: unknown;
    name?: unknown;
    description?: unknown;
    image?: unknown;
    digest?: unknown;
    postSlug?: unknown;
    postMintCapId?: unknown;
};

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get("walletAddress");

    if (typeof walletAddress !== "string" || !SUI_ADDRESS.test(walletAddress)) {
        return NextResponse.json({ error: "A valid Sui wallet address is required." }, { status: 400 });
    }

    try {
        const nfts = await getNftsByOwner(walletAddress.toLowerCase());
        return NextResponse.json({ nfts });
    } catch (error) {
        console.error("Failed to list minted NFTs:", error);
        return NextResponse.json({ error: "Unable to load your NFTs right now." }, { status: 500 });
    }
}

export async function POST(request: Request) {
    let body: NftPayload;

    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
    }

    if (typeof body.walletAddress !== "string" || !SUI_ADDRESS.test(body.walletAddress)) {
        return NextResponse.json({ error: "A valid Sui wallet address is required." }, { status: 400 });
    }

    if (typeof body.name !== "string" || !body.name.trim()) {
        return NextResponse.json({ error: "NFT name is required." }, { status: 400 });
    }

    if (typeof body.image !== "string" || !body.image.trim()) {
        return NextResponse.json({ error: "NFT image is required." }, { status: 400 });
    }

    if (typeof body.digest !== "string" || !body.digest.trim()) {
        return NextResponse.json({ error: "Transaction digest is required." }, { status: 400 });
    }

    if (body.postSlug !== undefined || body.postMintCapId !== undefined) {
        if (typeof body.postSlug !== "string" || !body.postSlug.trim() || typeof body.postMintCapId !== "string" || !body.postMintCapId.trim()) {
            return NextResponse.json({ error: "A post slug and mint authorization are required for a post NFT." }, { status: 400 });
        }

        const post = await getBlogPostBySlug(body.postSlug.trim());
        if (!post || !post.authorWallet || !post.postMintCapId) {
            return NextResponse.json({ error: "This post is not configured for creator-only minting." }, { status: 403 });
        }
        if (post.authorWallet.toLowerCase() !== body.walletAddress.toLowerCase() || post.postMintCapId !== body.postMintCapId.trim()) {
            return NextResponse.json({ error: "Only this post's author can record its NFT mint." }, { status: 403 });
        }
    }

    try {
        const nft = await createNft(body.walletAddress.toLowerCase(), {
            name: body.name.trim(),
            description: typeof body.description === "string" ? body.description.trim() : "",
            image: body.image.trim(),
            digest: body.digest.trim(),
            postSlug: typeof body.postSlug === "string" ? body.postSlug.trim() : undefined,
        });

        return NextResponse.json({ nft });
    } catch (error) {
        console.error("Failed to save minted NFT:", error);
        return NextResponse.json({ error: "Unable to save the NFT right now." }, { status: 500 });
    }
}
