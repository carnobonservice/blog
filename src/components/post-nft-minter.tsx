"use client";

import { useCurrentAccount, useCurrentClient, useDAppKit } from "@mysten/dapp-kit-react";
import { Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { BlogPost } from "@/app/lib/mongodbBlog";

type Status = { tone: "error" | "success" | "info"; message: string } | null;

export function PostNftMinter({ post }: { post: BlogPost }) {
    const account = useCurrentAccount();
    const client = useCurrentClient();
    const dAppKit = useDAppKit();
    const router = useRouter();
    const [minting, setMinting] = useState(false);
    const [status, setStatus] = useState<Status>(null);
    const isAuthor = Boolean(account?.address && post.authorWallet && account.address.toLowerCase() === post.authorWallet.toLowerCase());

    async function mintPost() {
        if (!account?.address || !isAuthor) return;
        const target = process.env.NEXT_PUBLIC_NFT_POST_MINT_TARGET;
        if (!target) {
            setStatus({ tone: "error", message: "Set NEXT_PUBLIC_NFT_POST_MINT_TARGET before minting post collectibles." });
            return;
        }

        setMinting(true);
        setStatus({ tone: "info", message: "Requesting a wallet signature…" });
        try {
            const capId = post.postMintCapId || await createAuthorization();
            if (!capId) return;
            const { Transaction } = await import("@mysten/sui/transactions");
            const tx = new Transaction();
            tx.moveCall({
                target,
                arguments: [tx.object(capId)],
            });
            const result = await dAppKit.signAndExecuteTransaction({ transaction: tx });
            if (result.$kind === "FailedTransaction") throw new Error(result.FailedTransaction.status.error?.message ?? "Mint failed.");
            const digest = result.Transaction.digest;
            await client.core.waitForTransaction({ digest });

            const response = await fetch("/api/nft", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    walletAddress: account.address,
                    name: post.blog_title,
                    description: post.blog_description,
                    image: post.blog_image || "/sui_blog.png",
                    digest,
                    postSlug: post.blog_slug,
                    postMintCapId: capId,
                }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "The NFT was minted, but its app record could not be saved.");
            setStatus({ tone: "success", message: "Post collectible minted. You can now transfer the NFT from your Sui wallet." });
        } catch (error) {
            setStatus({ tone: "error", message: error instanceof Error ? error.message : "Minting failed." });
        } finally {
            setMinting(false);
        }
    }

    async function createAuthorization(): Promise<string | null> {
        if (!account?.address || !isAuthor || post.postMintCapId) return post.postMintCapId || null;
        const mintTarget = process.env.NEXT_PUBLIC_NFT_POST_MINT_TARGET;
        const target = mintTarget?.replace(/::mint_post$/, "::create_post_mint_cap");
        if (!target || target === mintTarget) { setStatus({ tone: "error", message: "Set NEXT_PUBLIC_NFT_POST_MINT_TARGET before creating authorization." }); return null; }
        setMinting(true); setStatus({ tone: "info", message: "Creating your mint authorization…" });
        try {
            const { Transaction } = await import("@mysten/sui/transactions");
            const tx = new Transaction();
            tx.moveCall({ target, arguments: [tx.pure.string(post.blog_slug)] });
            const result = await dAppKit.signAndExecuteTransaction({ transaction: tx });
            if (result.$kind === "FailedTransaction") throw new Error(result.FailedTransaction.status.error?.message ?? "Authorization transaction failed.");
            const completed = await client.core.waitForTransaction({ digest: result.Transaction.digest, include: { effects: true, objectTypes: true } });
            if (completed.$kind === "FailedTransaction") throw new Error(completed.FailedTransaction.status.error?.message ?? "Authorization transaction failed.");
            const capId = completed.Transaction.effects.changedObjects.find((change) => change.idOperation === "Created" && completed.Transaction.objectTypes[change.objectId]?.endsWith("::collection::PostMintCap"))?.objectId;
            if (!capId) throw new Error("The mint authorization object was not found.");
            const timestamp = Date.now(); const walletAddress = account.address.toLowerCase();
            const message = `Gather link post mint cap\nwallet:${walletAddress}\nslug:${post.blog_slug}\ncap:${capId}\ntimestamp:${timestamp}`;
            const approval = await dAppKit.signPersonalMessage({ message: new TextEncoder().encode(message) });
            const response = await fetch(`/api/posts/${encodeURIComponent(post.blog_slug)}/mint-cap`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ walletAddress, postMintCapId: capId, timestamp, signature: approval.signature }) });
            const data = await response.json(); if (!response.ok) throw new Error(data.error || "Unable to link the mint authorization.");
            setStatus({ tone: "success", message: "Mint authorization ready." }); router.refresh();
            return capId;
        } catch (error) { setStatus({ tone: "error", message: error instanceof Error ? error.message : "Unable to create mint authorization." }); return null; }
        finally { setMinting(false); }
    }

    if (!post.authorWallet) return null;
    return <section className="mt-8 rounded-xl border border-violet-200 bg-violet-50 p-5">
        <div className="flex items-start justify-between gap-4"><div><h2 className="flex items-center gap-2 font-semibold text-violet-950"><Sparkles className="size-4" /> Post collectible</h2><p className="mt-1 text-sm text-violet-900/70">Only this post&apos;s original author can mint its one Sui collectible.</p></div><button className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50" disabled={!isAuthor || minting} onClick={() => void mintPost()} type="button">{minting ? <span className="inline-flex items-center gap-2"><Loader2 className="size-4 animate-spin" /> Minting</span> : "Mint as NFT"}</button></div>
        {!account ? <p className="mt-3 text-sm text-violet-900/70">Connect the author&apos;s wallet to mint.</p> : !isAuthor ? <p className="mt-3 text-sm text-violet-900/70">Only the author wallet can mint this post.</p> : !post.postMintCapId ? <p className="mt-3 text-sm text-amber-800">Minting will first create this post&apos;s authorization, then mint its NFT.</p> : null}
        {status ? <p className={`mt-3 text-sm font-medium ${status.tone === "error" ? "text-rose-700" : status.tone === "success" ? "text-emerald-700" : "text-violet-800"}`}>{status.message}</p> : null}
    </section>;
}
