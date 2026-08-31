"use client";

import { useCurrentAccount } from "@mysten/dapp-kit-react";
import { useQuery } from "@tanstack/react-query";
import { ImageIcon, Images, Loader2, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

type GalleryImage = { id: string; url: string };
type Nft = { id: string; name: string; image: string };

export function ProfileMediaPicker({
  target,
  onClose,
  onSelect,
}: {
  target: "profile" | "cover";
  onClose: () => void;
  onSelect: (imageUrl: string) => void;
}) {
  const account = useCurrentAccount();
  const [source, setSource] = useState<"images" | "nfts">("images");

  const imagesQuery = useQuery({
    queryKey: ["nft-gallery", account?.address],
    queryFn: async () => {
      const response = await fetch(`/api/profile/upload?walletAddress=${encodeURIComponent(account!.address)}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load your images.");
      return (data.images ?? []) as GalleryImage[];
    },
    enabled: Boolean(account?.address),
  });
  const nftsQuery = useQuery({
    queryKey: ["profile-nfts", account?.address],
    queryFn: async () => {
      const response = await fetch(`/api/nft?walletAddress=${encodeURIComponent(account!.address)}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load your NFTs.");
      return (data.nfts ?? []) as Nft[];
    },
    enabled: Boolean(account?.address),
  });

  const items = source === "images" ? imagesQuery.data ?? [] : nftsQuery.data ?? [];
  const isLoading = source === "images" ? imagesQuery.isPending : nftsQuery.isPending;
  const isError = source === "images" ? imagesQuery.isError : nftsQuery.isError;
  const label = target === "profile" ? "avatar" : "cover image";

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/35 p-4 backdrop-blur-sm">
      <section aria-modal="true" aria-labelledby="media-picker-title" className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl" role="dialog">
        <div className="flex items-start justify-between border-b border-black/5 px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-lg font-bold" id="media-picker-title">Change {label}</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">Choose an uploaded image or artwork from one of your NFTs.</p>
          </div>
          <button aria-label="Close" className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground" onClick={onClose} type="button"><X className="size-4" /></button>
        </div>

        <div className="flex gap-2 border-b border-black/5 px-5 pt-3 sm:px-6">
          {([
            ["images", "Images", Images],
            ["nfts", "NFTs", Sparkles],
          ] as const).map(([value, name, Icon]) => (
            <button className={cn("inline-flex items-center gap-1.5 border-b-2 px-2 py-2.5 text-sm font-semibold", source === value ? "border-violet-600 text-violet-700" : "border-transparent text-muted-foreground hover:text-foreground")} key={value} onClick={() => setSource(value)} type="button"><Icon className="size-4" /> {name}</button>
          ))}
        </div>

        <div className="max-h-[55vh] overflow-y-auto p-5 sm:p-6">
          {!account?.address ? <p className="py-8 text-center text-sm text-muted-foreground">Connect your wallet to choose an image.</p> : isLoading ? <p className="flex justify-center gap-2 py-8 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Loading…</p> : isError ? <p className="py-8 text-center text-sm text-rose-600">Unable to load these assets.</p> : items.length ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {items.map((item) => (
                <button className="group overflow-hidden rounded-xl border border-black/5 text-left transition hover:ring-2 hover:ring-violet-500" key={item.id} onClick={() => onSelect("url" in item ? item.url : item.image)} type="button">
                  <img alt={source === "nfts" ? (item as Nft).name : "Uploaded image"} className="aspect-square w-full object-cover" src={"url" in item ? item.url : item.image} />
                  {source === "nfts" ? <p className="truncate px-2 py-2 text-xs font-semibold">{(item as Nft).name}</p> : null}
                </button>
              ))}
            </div>
          ) : <div className="py-8 text-center"><ImageIcon className="mx-auto size-5 text-violet-500" /><p className="mt-2 text-sm text-muted-foreground">No {source === "images" ? "uploaded images" : "minted NFTs"} yet.</p></div>}
        </div>
      </section>
    </div>
  );
}
