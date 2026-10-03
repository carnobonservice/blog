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
    tag?: string;
    likes: number;
    comments: number;
    image?: string;
};

const starterPosts: FeedPost[] = [
    { id: "welcome", author: "Maya Chen", handle: "@mayac", initials: "MC", color: "bg-violet-500", time: "12m", body: "Small progress is still progress. What are you making today?", tag: "#buildinpublic", likes: 124, comments: 18 },
    { id: "studio", author: "Noah Williams", handle: "@noahw", initials: "NW", color: "bg-amber-500", time: "36m", body: "Found the perfect corner for a deep work session. Sharing the view because it feels too good to keep to myself.", likes: 86, comments: 9 },
];

const formatCount = (count: number) => count >= 1000 ? `${(count / 1000).toFixed(1)}k` : count.toString();

function postBody(post: BlogPost) {
    return (post.blog_description || post.blog_content || "").replace(/<br\s*\/?>(\n)?/g, " ");
}

export function SocialHome({ initialPosts }: { initialPosts: BlogPost[] }) {
    const [liked, setLiked] = useState<string[]>([]);
    const databasePosts = useMemo<FeedPost[]>(() => initialPosts.map((post, index) => ({
        id: post._id || `article-${index}`,
        author: "Community member",
        handle: post.authorWallet ? `@${post.authorWallet.slice(0, 6)}` : "@community",
        initials: "CM",
        color: "bg-sky-500",
        time: post.createdAt ? new Date(post.createdAt).toLocaleDateString() : "Recently",
        title: post.blog_title,
        href: post.blog_slug ? `/post/${post.blog_slug}` : undefined,
        body: postBody(post),
        likes: 0,
        comments: 0,
        image: post.blog_image || undefined,
    })), [initialPosts]);
    const allPosts = databasePosts.length > 0 ? databasePosts : starterPosts;

    return (
        <main className="min-h-[calc(100vh-4rem)] bg-[#f8f8fb]">
            <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-[220px_minmax(0,640px)_280px] lg:px-6">
                <aside className="hidden lg:block"><div className="sticky top-24 space-y-6"><section className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm"><div className="h-16 bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-400" /><div className="px-4 pb-4"><div className="-mt-8 grid size-16 place-items-center rounded-2xl border-4 border-white bg-slate-900 text-lg font-bold text-white">YO</div><Link href="/profile" className="mt-3 block font-semibold hover:text-violet-700">Your space</Link><p className="text-sm text-muted-foreground">Share ideas. Find your people.</p></div></section><nav className="space-y-1 px-1 text-sm font-medium"><Link className="flex items-center gap-3 rounded-xl bg-violet-50 px-3 py-2.5 text-violet-700" href="/"><Sparkles className="size-4" /> For you</Link><Link className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-muted-foreground hover:bg-white hover:text-foreground" href="/discover"><UsersRound className="size-4" /> Discover people</Link><Link className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-muted-foreground hover:bg-white hover:text-foreground" href="/events"><CalendarDays className="size-4" /> Events</Link><Link className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-muted-foreground hover:bg-white hover:text-foreground" href="/notifications"><Bell className="size-4" /> Notifications</Link></nav></div></aside>

                <section id="feed" className="min-w-0 space-y-5"><div className="flex items-end justify-between px-1"><div><p className="text-sm font-medium text-violet-600">GOOD MORNING</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Your community</h1></div><button aria-label="Search" className="grid size-10 place-items-center rounded-xl bg-white text-muted-foreground shadow-sm ring-1 ring-black/5 hover:text-foreground"><Search className="size-5" /></button></div><CreatePostForm /><div className="flex gap-5 border-b px-1 text-sm font-semibold"><button className="border-b-2 border-violet-600 px-1 pb-3 text-violet-700">For you</button><button className="px-1 pb-3 text-muted-foreground">Following</button></div>
                    {allPosts.map((post) => { const isLiked = liked.includes(post.id); const content = <>{post.title && <h2 className="mt-3 text-lg font-semibold">{post.title}</h2>}<p className="mt-3 whitespace-pre-line text-[15px] leading-6 text-foreground/90">{post.body}</p>{post.tag && <p className="mt-2 text-sm font-medium text-violet-600">{post.tag}</p>}</>; return <article key={post.id} className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm sm:p-5"><div className="flex gap-3"><div className={cn("grid size-10 shrink-0 place-items-center rounded-xl text-xs font-bold text-white", post.color)}>{post.initials}</div><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><p className="font-semibold leading-tight">{post.author} <span className="ml-1 font-normal text-muted-foreground">{post.handle} · {post.time}</span></p><button aria-label="More options" className="text-muted-foreground"><MoreHorizontal className="size-5" /></button></div>{post.href ? <Link href={post.href} className="block hover:text-violet-700">{content}</Link> : content}{post.image && <Image unoptimized src={post.image} alt={post.title || "Post image"} className="mt-4 h-52 w-full rounded-xl object-cover" height={208} width={640} />}<div className="mt-4 flex gap-5 border-t pt-3 text-sm text-muted-foreground"><button onClick={() => setLiked((current) => isLiked ? current.filter((id) => id !== post.id) : [...current, post.id])} className={cn("inline-flex items-center gap-1.5 transition", isLiked && "text-rose-500")}><Heart className={cn("size-4", isLiked && "fill-current")} /> {formatCount(post.likes + (isLiked ? 1 : 0))}</button><button className="inline-flex items-center gap-1.5 hover:text-foreground"><MessageCircle className="size-4" /> {post.comments}</button></div></div></div></article>; })}
                </section>

                <aside className="hidden lg:block"><div className="sticky top-24 space-y-5"><section className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm"><h2 className="font-bold">People to follow</h2><p className="mt-2 text-sm text-muted-foreground">Discover more community members.</p></section><section className="rounded-2xl bg-slate-900 p-5 text-white"><p className="text-xs font-bold tracking-[0.16em] text-violet-300">UP NEXT</p><h2 className="mt-2 text-lg font-bold">Creators&apos; coffee chat</h2><p className="mt-2 text-sm text-slate-300">Thursday · 10:00 AM</p></section></div></aside>
            </div>
        </main>
    );
}
