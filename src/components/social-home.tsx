"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Bell, CalendarDays, Heart, MessageCircle, MoreHorizontal, Search, Sparkles, UsersRound } from "lucide-react";
import type { BlogPost } from "@/app/lib/mongodbBlog";
import { CreatePostForm } from "@/components/create-post-form";
import { cn } from "@/lib/utils";

type FeedPost = {
    id: string;
    author: string;
    handle: string;
    initials: string;
    color: string;
    time: string;
    body: string;
    title?: string;
    href?: string;
    isNft?: boolean;
    tag?: string;
    likes: number;
    comments: number;
    image?: string;
};

const formatCount = (count: number) => count >= 1000 ? `${(count / 1000).toFixed(1)}k` : count.toString();

function postBody(post: BlogPost) {
    return (post.blog_description || post.blog_content || "").replace(/<br\s*\/?>(\n)?/g, " ");
}

export function SocialHome({ initialPosts, nftPostSlugs }: { initialPosts: BlogPost[]; nftPostSlugs: string[] }) {
    const [liked, setLiked] = useState<string[]>([]);
    const [search, setSearch] = useState("");
    const [showNftPosts, setShowNftPosts] = useState(false);
    const nftPostSlugSet = useMemo(() => new Set(nftPostSlugs), [nftPostSlugs]);
    const databasePosts = useMemo<FeedPost[]>(() => initialPosts.map((post, index) => ({
        id: post._id || `article-${index}`,
        author: "Community member",
        handle: post.authorWallet ? `@${post.authorWallet.slice(0, 6)}` : "@community",
        initials: "CM",
        color: "bg-sky-500",
        time: post.createdAt ? new Date(post.createdAt).toLocaleDateString() : "Recently",
        title: post.blog_title,
        href: post.blog_slug ? `/post/${post.blog_slug}` : undefined,
        isNft: nftPostSlugSet.has(post.blog_slug),
        body: postBody(post),
        likes: 0,
        comments: 0,
        image: post.blog_image || undefined,
    })), [initialPosts, nftPostSlugSet]);
    const visiblePosts = useMemo(() => {
        const query = search.trim().toLocaleLowerCase();
        return databasePosts.filter((post) => {
            const matchesQuery = !query || `${post.title ?? ""} ${post.body} ${post.author} ${post.handle}`.toLocaleLowerCase().includes(query);
            return matchesQuery && (!showNftPosts || post.isNft);
        });
    }, [databasePosts, search, showNftPosts]);

    return (
        <main className="min-h-[calc(100vh-4rem)] bg-[#f8f8fb]">
            <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-[220px_minmax(0,640px)_280px] lg:px-6">
                <aside className="hidden lg:block"><div className="sticky top-24 space-y-6"><section className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm"><div className="h-16 bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-400" /><div className="px-4 pb-4"><div className="-mt-8 grid size-16 place-items-center rounded-2xl border-4 border-white bg-slate-900 text-lg font-bold text-white">YO</div><Link href="/profile" className="mt-3 block font-semibold hover:text-violet-700">Your space</Link><p className="text-sm text-muted-foreground">Share ideas. Find your people.</p></div></section><nav className="space-y-1 px-1 text-sm font-medium"><Link className="flex items-center gap-3 rounded-xl bg-violet-50 px-3 py-2.5 text-violet-700" href="/"><Sparkles className="size-4" /> For you</Link><Link className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-muted-foreground hover:bg-white hover:text-foreground" href="/discover"><UsersRound className="size-4" /> Discover people</Link><Link className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-muted-foreground hover:bg-white hover:text-foreground" href="/events"><CalendarDays className="size-4" /> Events</Link><Link className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-muted-foreground hover:bg-white hover:text-foreground" href="/notifications"><Bell className="size-4" /> Notifications</Link></nav></div></aside>

                <section id="feed" className="min-w-0 space-y-5"><div className="flex items-end justify-between px-1"><div><p className="text-sm font-medium text-violet-600">YOUR SPACE</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Your community</h1></div><label className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl bg-white text-muted-foreground shadow-sm ring-1 ring-black/5 focus-within:w-56 focus-within:justify-start focus-within:px-3 focus-within:gap-2"><Search className="size-5 shrink-0" /><span className="sr-only">Search posts</span><input aria-label="Search posts" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search posts" className="w-0 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground focus:w-full" /></label></div><CreatePostForm /><div className="flex gap-5 border-b px-1 text-sm font-semibold"><button aria-pressed={!showNftPosts} onClick={() => setShowNftPosts(false)} className={cn("border-b-2 px-1 pb-3", !showNftPosts ? "border-violet-600 text-violet-700" : "border-transparent text-muted-foreground")}>All posts</button><button aria-pressed={showNftPosts} onClick={() => setShowNftPosts(true)} className={cn("border-b-2 px-1 pb-3", showNftPosts ? "border-violet-600 text-violet-700" : "border-transparent text-muted-foreground")}>Collectibles</button></div>
                    {visiblePosts.length === 0 ? <div className="rounded-2xl border border-dashed border-black/10 bg-white px-6 py-12 text-center"><h2 className="font-semibold">{databasePosts.length === 0 ? "No posts yet" : "No posts match your search"}</h2><p className="mt-2 text-sm text-muted-foreground">{databasePosts.length === 0 ? "Be the first to share something with the community." : "Try a different search or switch back to all posts."}</p></div> : visiblePosts.map((post) => { const isLiked = liked.includes(post.id); const content = <>{post.title && <div className="mt-3 flex flex-wrap items-center gap-2"><h2 className="text-lg font-semibold">{post.title}</h2>{post.isNft && <span className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-0.5 text-xs font-semibold text-violet-800" aria-label="NFT post"><Sparkles className="size-3" aria-hidden="true" /> NFT</span>}</div>}<p className="mt-3 whitespace-pre-line text-[15px] leading-6 text-foreground/90">{post.body}</p>{post.tag && <p className="mt-2 text-sm font-medium text-violet-600">{post.tag}</p>}</>; return <article key={post.id} className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm sm:p-5"><div className="flex gap-3"><div className={cn("grid size-10 shrink-0 place-items-center rounded-xl text-xs font-bold text-white", post.color)}>{post.initials}</div><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><p className="font-semibold leading-tight">{post.author} <span className="ml-1 font-normal text-muted-foreground">{post.handle} · {post.time}</span></p><button aria-label="More options" className="text-muted-foreground"><MoreHorizontal className="size-5" /></button></div>{post.href ? <Link href={post.href} className="block hover:text-violet-700">{content}</Link> : content}{post.image && <Image unoptimized src={post.image} alt={post.title || "Post image"} className="mt-4 h-52 w-full rounded-xl object-cover" height={208} width={640} />}<div className="mt-4 flex gap-5 border-t pt-3 text-sm text-muted-foreground"><button onClick={() => setLiked((current) => isLiked ? current.filter((id) => id !== post.id) : [...current, post.id])} className={cn("inline-flex items-center gap-1.5 transition", isLiked && "text-rose-500")}><Heart className={cn("size-4", isLiked && "fill-current")} /> {formatCount(post.likes + (isLiked ? 1 : 0))}</button>{post.href ? <Link href={post.href} className="inline-flex items-center gap-1.5 hover:text-foreground"><MessageCircle className="size-4" /> Read post</Link> : <span className="inline-flex items-center gap-1.5"><MessageCircle className="size-4" /> {post.comments}</span>}</div></div></div></article>; })}
                </section>

                <aside className="hidden lg:block"><div className="sticky top-24 space-y-5"><section className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm"><h2 className="font-bold">People to follow</h2><p className="mt-2 text-sm text-muted-foreground">Discover more community members.</p></section><section className="rounded-2xl bg-slate-900 p-5 text-white"><p className="text-xs font-bold tracking-[0.16em] text-violet-300">UP NEXT</p><h2 className="mt-2 text-lg font-bold">Creators&apos; coffee chat</h2><p className="mt-2 text-sm text-slate-300">Thursday · 10:00 AM</p></section></div></aside>
            </div>
        </main>
    );
}
