"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CalendarDays, Copy, ExternalLink, Loader2, UserRound } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

type Nft = {
  id: string;
  owner: string;
  name: string;
  description: string;
  image: string;
  digest: string;
  createdAt: string;
};

function shortValue(value: string, start = 8, end = 6) {
  return `${value.slice(0, start)}…${value.slice(-end)}`;
}

export function NftDetailPage() {
  const params = useParams<{ id: string }>();
  const [copied, setCopied] = useState<"owner" | "digest" | null>(null);
  const id = params.id;
  const { data, isPending, isError } = useQuery({
    queryKey: ["nft-detail", id],
    queryFn: async () => {
      const response = await fetch(`/api/nft/${encodeURIComponent(id)}`);
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to load this NFT.");
      return result.nft as Nft;
    },
    enabled: Boolean(id),
  });

  async function copy(value: string, field: "owner" | "digest") {
    await navigator.clipboard.writeText(value);
    setCopied(field);
    window.setTimeout(() => setCopied(null), 1600);
  }

  if (isPending) return <main className="grid min-h-[calc(100vh-4rem)] place-items-center bg-[#f8f8fb]"><p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Loading NFT…</p></main>;
  if (isError || !data) return <main className="grid min-h-[calc(100vh-4rem)] place-items-center bg-[#f8f8fb] p-4"><div className="text-center"><h1 className="text-xl font-bold">NFT not found</h1><Link className="mt-3 inline-flex text-sm font-semibold text-violet-700 hover:underline" href="/profile">Return to profile</Link></div></main>;

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-[#f8f8fb] py-6 sm:py-10">
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
        <Link className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-violet-700" href="/profile"><ArrowLeft className="size-4" /> Back to profile</Link>
        <section className="grid overflow-hidden rounded-3xl border border-black/5 bg-white shadow-sm md:grid-cols-2">
          <div className="bg-slate-100"><img alt={data.name} className="aspect-square h-full w-full object-cover" src={data.image} /></div>
          <div className="flex flex-col p-6 sm:p-8">
            <p className="text-sm font-semibold text-violet-700">Gather collectible</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{data.name}</h1>
            <p className="mt-5 leading-7 text-muted-foreground">{data.description || "No description provided for this NFT."}</p>
            <div className="mt-8 space-y-4 border-t border-black/5 pt-5 text-sm">
              <DetailRow icon={UserRound} label="Owner" value={shortValue(data.owner)} onCopy={() => void copy(data.owner, "owner")} copied={copied === "owner"} />
              <DetailRow icon={CalendarDays} label="Minted" value={new Date(data.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })} />
              <DetailRow icon={ExternalLink} label="Transaction" value={shortValue(data.digest)} onCopy={() => void copy(data.digest, "digest")} copied={copied === "digest"} />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function DetailRow({ icon: Icon, label, value, onCopy, copied }: { icon: typeof UserRound; label: string; value: string; onCopy?: () => void; copied?: boolean }) {
  return <div className="flex items-center gap-3"><Icon className="size-4 text-violet-600" /><span className="w-20 text-muted-foreground">{label}</span><span className="min-w-0 flex-1 truncate font-medium">{value}</span>{onCopy ? <button className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground" onClick={onCopy} type="button" title="Copy"><Copy className="size-3.5" /><span className="sr-only">{copied ? "Copied" : "Copy"}</span></button> : null}</div>;
}
