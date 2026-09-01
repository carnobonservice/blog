"use client";

import { useCurrentAccount, useCurrentClient, useDAppKit } from "@mysten/dapp-kit-react";
import { Loader2, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Status = { tone: "error" | "info"; message: string } | null;

function makeSlug(title: string) {
    const base = title.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 72) || "post";
    return `${base}-${crypto.randomUUID().slice(0, 8)}`;
}

export function CreatePostForm() {
    const account = useCurrentAccount();
    const client = useCurrentClient();
    const dAppKit = useDAppKit();
    const router = useRouter();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [content, setContent] = useState("");
    const [publishing, setPublishing] = useState(false);
    const [status, setStatus] = useState<Status>(null);

    async function publish() {
        if (!account?.address) { setStatus({ tone: "error", message: "Connect your Sui wallet before publishing." }); return; }
        if (!title.trim() || !content.trim()) { setStatus({ tone: "error", message: "A title and post content are required." }); return; }
        const mintTarget = process.env.NEXT_PUBLIC_NFT_POST_MINT_TARGET;
        const capTarget = mintTarget?.replace(/::mint_post$/, "::create_post_mint_cap");
        if (!capTarget || capTarget === mintTarget) { setStatus({ tone: "error", message: "Set NEXT_PUBLIC_NFT_POST_MINT_TARGET to the package's ::collection::mint_post function before publishing." }); return; }
        const walletAddress = account.address.toLowerCase();
        const cleanTitle = title.trim(); const cleanDescription = description.trim(); const cleanContent = content.trim();
        const slug = makeSlug(cleanTitle); const timestamp = Date.now();
        const message = `Gather create post\nwallet:${walletAddress}\nslug:${slug}\ntitle:${cleanTitle}\ndescription:${cleanDescription}\ncontent:${cleanContent}\ntimestamp:${timestamp}`;
        setPublishing(true); setStatus({ tone: "info", message: "Approve the post with your wallet…" });
        try {
            const approval = await dAppKit.signPersonalMessage({ message: new TextEncoder().encode(message) });
            const postResponse = await fetch("/api/posts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ walletAddress, title: cleanTitle, description: cleanDescription, content: cleanContent, slug, timestamp, signature: approval.signature }) });
            const postData = await postResponse.json();
            if (!postResponse.ok) throw new Error(postData.error || "Unable to publish this post.");

            setStatus({ tone: "info", message: "Creating your creator-only mint authorization…" });
            const { Transaction } = await import("@mysten/sui/transactions");
            const tx = new Transaction();
            tx.moveCall({ target: capTarget, arguments: [tx.pure.string(slug)] });
            const result = await dAppKit.signAndExecuteTransaction({ transaction: tx });
            if (result.$kind === "FailedTransaction") throw new Error(result.FailedTransaction.status.error?.message ?? "Unable to create the mint authorization.");
            const completed = await client.core.waitForTransaction({ digest: result.Transaction.digest, include: { effects: true, objectTypes: true } });
            if (completed.$kind === "FailedTransaction") throw new Error(completed.FailedTransaction.status.error?.message ?? "Mint authorization transaction failed.");
            const capId = completed.Transaction.effects.changedObjects.find((change) => change.idOperation === "Created" && completed.Transaction.objectTypes[change.objectId]?.endsWith("::collection::PostMintCap"))?.objectId;
            if (!capId) throw new Error("Post published, but its mint authorization object was not found.");

            const capTimestamp = Date.now();
            const capMessage = `Gather link post mint cap\nwallet:${walletAddress}\nslug:${slug}\ncap:${capId}\ntimestamp:${capTimestamp}`;
            const capApproval = await dAppKit.signPersonalMessage({ message: new TextEncoder().encode(capMessage) });
            const capResponse = await fetch(`/api/posts/${encodeURIComponent(slug)}/mint-cap`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ walletAddress, postMintCapId: capId, timestamp: capTimestamp, signature: capApproval.signature }) });
            const capData = await capResponse.json();
            if (!capResponse.ok) throw new Error(capData.error || "Post published, but its mint authorization could not be linked.");
            router.push(`/post/${slug}`); router.refresh();
        } catch (error) { setStatus({ tone: "error", message: error instanceof Error ? error.message : "Unable to publish this post." }); }
        finally { setPublishing(false); }
    }

    return <section className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
        <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Post title" className="w-full bg-transparent text-lg font-semibold outline-none placeholder:text-muted-foreground" maxLength={160} />
        <input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Short description (optional)" className="mt-3 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" maxLength={500} />
        <textarea value={content} onChange={(event) => setContent(event.target.value)} placeholder="What do you want to share?" className="mt-3 min-h-28 w-full resize-y bg-transparent text-[15px] leading-6 outline-none placeholder:text-muted-foreground" maxLength={50_000} />
        <div className="mt-3 flex items-center justify-between border-t pt-3"><p className="text-xs text-muted-foreground">Your wallet becomes the post&apos;s verified author.</p><button onClick={() => void publish()} disabled={publishing || !title.trim() || !content.trim()} className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-40" type="button">{publishing ? <><Loader2 className="size-3.5 animate-spin" /> Publishing</> : <>Publish <Send className="size-3.5" /></>}</button></div>
        {status ? <p className={`mt-3 text-sm font-medium ${status.tone === "error" ? "text-rose-700" : "text-violet-700"}`}>{status.message}</p> : null}
    </section>;
}
