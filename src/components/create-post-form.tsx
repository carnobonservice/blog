"use client";

import { useCurrentAccount } from "@mysten/dapp-kit-react";
import { ImageIcon, Loader2, Send, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ProfileMediaPicker } from "@/components/profile-media-picker";

type Status = { tone: "error" | "info"; message: string } | null;

function makeSlug(title: string) {
    const base = title.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 72) || "post";
    return `${base}-${crypto.randomUUID().slice(0, 8)}`;
}

export function CreatePostForm() {
    const account = useCurrentAccount();
    const router = useRouter();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [content, setContent] = useState("");
    const [image, setImage] = useState("");
    const [showMediaPicker, setShowMediaPicker] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const [status, setStatus] = useState<Status>(null);

    async function publish() {
        if (!account?.address) { setStatus({ tone: "error", message: "Connect your Sui wallet before publishing." }); return; }
        if (!title.trim() || !content.trim()) { setStatus({ tone: "error", message: "A title and post content are required." }); return; }
        const walletAddress = account.address.toLowerCase();
        const cleanTitle = title.trim(); const cleanDescription = description.trim(); const cleanContent = content.trim(); const cleanImage = image.trim();
        const slug = makeSlug(cleanTitle); const timestamp = Date.now();
        setPublishing(true); setStatus({ tone: "info", message: "Publishing your post…" });
        try {
            const postResponse = await fetch("/api/posts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ walletAddress, title: cleanTitle, description: cleanDescription, content: cleanContent, image: cleanImage, slug, timestamp }) });
            const postData = await postResponse.json();
            if (!postResponse.ok) throw new Error(postData.error || "Unable to publish this post.");
            setStatus({ tone: "info", message: "Post published. You can mint it as a collectible from the post page later." });
            router.push(`/post/${slug}`); router.refresh();
        } catch (error) { setStatus({ tone: "error", message: error instanceof Error ? error.message : "Unable to publish this post." }); }
        finally { setPublishing(false); }
    }

    return <section className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
        <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Post title" className="w-full bg-transparent text-lg font-semibold outline-none placeholder:text-muted-foreground" maxLength={160} />
        <input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Short description (optional)" className="mt-3 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" maxLength={500} />
        <div className="mt-3 flex items-center gap-3">
            {image ? <div className="relative size-16 shrink-0 overflow-hidden rounded-lg"><img src={image} alt="Selected post image" className="size-full object-cover" /><button aria-label="Remove selected image" className="absolute right-1 top-1 grid size-5 place-items-center rounded-full bg-slate-950/75 text-white" onClick={() => setImage("")} type="button"><X className="size-3" /></button></div> : null}
            <button className="inline-flex items-center gap-2 rounded-lg border border-dashed border-violet-300 px-3 py-2 text-sm font-semibold text-violet-700 hover:bg-violet-50" onClick={() => setShowMediaPicker(true)} type="button"><ImageIcon className="size-4" /> {image ? "Change image" : "Choose an image"}</button>
        </div>
        <textarea value={content} onChange={(event) => setContent(event.target.value)} placeholder="What do you want to share?" className="mt-3 min-h-28 w-full resize-y bg-transparent text-[15px] leading-6 outline-none placeholder:text-muted-foreground" maxLength={50_000} />
        <div className="mt-3 flex items-center justify-between border-t pt-3"><p className="text-xs text-muted-foreground">Your wallet becomes the post&apos;s verified author.</p><button onClick={() => void publish()} disabled={publishing || !title.trim() || !content.trim()} className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-40" type="button">{publishing ? <><Loader2 className="size-3.5 animate-spin" /> Publishing</> : <>Publish <Send className="size-3.5" /></>}</button></div>
        {status ? <p className={`mt-3 text-sm font-medium ${status.tone === "error" ? "text-rose-700" : "text-violet-700"}`}>{status.message}</p> : null}
        {showMediaPicker ? <ProfileMediaPicker target="post" onClose={() => setShowMediaPicker(false)} onSelect={(imageUrl) => { setImage(imageUrl); setShowMediaPicker(false); }} /> : null}
    </section>;
}
