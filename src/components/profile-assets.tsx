"use client";

import { useCurrentAccount } from "@mysten/dapp-kit-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ImageIcon, Images, Loader2, Palette, Plus, Sparkles, Upload } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { NftMinter } from "@/components/nft-minter";
import { cn } from "@/lib/utils";

type GalleryImage = {
  id: string;
  url: string;
  createdAt: string;
};

type Nft = {
  id: string;
  name: string;
  description: string;
  image: string;
  digest: string;
  createdAt: string;
};

type AssetTab = "images" | "nfts";

export function ProfileAssets({
  onUseImage,
  embedded = false,
}: {
  onUseImage: (imageUrl: string, placement: "profile" | "cover") => void;
  embedded?: boolean;
}) {
  const account = useCurrentAccount();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<AssetTab>("images");
  const [showMinter, setShowMinter] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ tone: "success" | "error"; message: string } | null>(null);

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

  const images = imagesQuery.data ?? [];
  const nfts = nftsQuery.data ?? [];
  const loading = activeTab === "images" ? imagesQuery.isPending : nftsQuery.isPending;
  const failed = activeTab === "images" ? imagesQuery.isError : nftsQuery.isError;

  async function uploadImage() {
    if (!selectedFile || !account?.address) return;

    setUploadingImage(true);
    setUploadStatus(null);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("walletAddress", account.address);
      const response = await fetch("/api/profile/upload", { method: "POST", body: formData });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Image upload failed.");

      setSelectedFile(null);
      setUploadStatus({ tone: "success", message: "Image added to your library." });
      await queryClient.invalidateQueries({ queryKey: ["nft-gallery", account.address] });
    } catch (error) {
      setUploadStatus({
        tone: "error",
        message: error instanceof Error ? error.message : "Image upload failed.",
      });
    } finally {
      setUploadingImage(false);
    }
  }

  return (
    <section className={cn(!embedded && "mt-6 overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm")}>
      <div className="flex flex-col gap-4 border-b border-black/5 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-2.5">
          <div className="grid size-9 place-items-center rounded-xl bg-slate-900 text-white">
            <Palette className="size-4" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Manage assets</h2>
            <p className="text-sm text-muted-foreground">Your image library and minted collectibles.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === "nfts" ? (
            <button className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-violet-700" onClick={() => setShowMinter((visible) => !visible)} type="button">
              <Plus className="size-4" /> {showMinter ? "Close minter" : "Mint NFT"}
            </button>
          ) : null}
          <div className="flex rounded-xl bg-muted p-1">
            {([
              ["images", "Images", Images, images.length],
              ["nfts", "NFTs", Sparkles, nfts.length],
            ] as const).map(([tab, label, Icon, count]) => (
              <button
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition",
                  activeTab === tab ? "bg-white text-violet-700 shadow-sm" : "text-muted-foreground hover:text-foreground",
                )}
                key={tab}
                onClick={() => setActiveTab(tab)}
                type="button"
              >
                <Icon className="size-3.5" /> {label} <span className="text-xs opacity-70">{count}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {!account?.address ? (
        <div className="p-8 text-center text-sm text-muted-foreground">Connect your wallet to manage your images and NFTs.</div>
      ) : loading ? (
        <div className="flex items-center justify-center gap-2 p-8 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Loading your assets…</div>
      ) : failed ? (
        <div className="p-8 text-center text-sm text-rose-600">We couldn’t load these assets. Please try again.</div>
      ) : activeTab === "images" ? (
        <div className="space-y-5 p-5 sm:p-6">
          <div className="rounded-xl border border-dashed border-violet-200 bg-violet-50/60 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-semibold">Add an image</h3>
                <p className="mt-0.5 text-sm text-muted-foreground">Upload it once, then reuse it on your profile or in an NFT.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-semibold shadow-sm transition hover:bg-muted">
                  <Upload className="size-4" />
                  {selectedFile ? selectedFile.name : "Choose image"}
                  <input accept="image/*" className="sr-only" onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)} type="file" />
                </label>
                <button className="rounded-xl bg-violet-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50" disabled={!selectedFile || uploadingImage} onClick={() => void uploadImage()} type="button">
                  {uploadingImage ? "Uploading…" : "Upload"}
                </button>
              </div>
            </div>
            {uploadStatus ? <p className={cn("mt-3 text-sm font-medium", uploadStatus.tone === "success" ? "text-emerald-700" : "text-rose-700")}>{uploadStatus.message}</p> : null}
          </div>

          {images.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {images.map((image) => (
                <article className="overflow-hidden rounded-xl border border-black/5 bg-white" key={image.id}>
                  <img alt="Your uploaded image" className="aspect-[4/3] w-full object-cover" src={image.url} />
                  <div className="flex items-center justify-between gap-2 p-3">
                    <p className="text-xs text-muted-foreground">{new Date(image.createdAt).toLocaleDateString()}</p>
                    <div className="flex gap-1.5">
                      <button className="rounded-lg border border-black/10 px-2 py-1 text-xs font-semibold transition hover:bg-muted" onClick={() => onUseImage(image.url, "profile")} type="button">Use as avatar</button>
                      <button className="rounded-lg border border-black/10 px-2 py-1 text-xs font-semibold transition hover:bg-muted" onClick={() => onUseImage(image.url, "cover")} type="button">Use as cover</button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState icon={ImageIcon} title="Your image library is empty" description="Upload an image above to reuse it for your profile or a future NFT." />
          )}
        </div>
      ) : nfts.length ? (
        <div className="space-y-5 p-5 sm:p-6">
          {showMinter ? <NftMinter /> : null}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {nfts.map((nft) => (
            <Link className="overflow-hidden rounded-xl border border-black/5 bg-white transition hover:-translate-y-0.5 hover:shadow-md" href={`/nft/${nft.id}`} key={nft.id}>
              <img alt={nft.name} className="aspect-square w-full object-cover" src={nft.image} />
              <div className="p-3">
                <h3 className="truncate font-semibold">{nft.name}</h3>
                <p className="mt-1 line-clamp-2 min-h-10 text-xs leading-5 text-muted-foreground">{nft.description || "No description provided."}</p>
                <p className="mt-3 truncate font-mono text-[10px] text-muted-foreground">{nft.digest}</p>
              </div>
            </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-5 p-5 sm:p-6">
          {showMinter ? <NftMinter /> : <EmptyState icon={Sparkles} title="No NFTs minted yet" description="Use the Mint NFT button above to create your first collectible." />}
        </div>
      )}
    </section>
  );
}

function EmptyState({ icon: Icon, title, description }: { icon: typeof ImageIcon; title: string; description: string }) {
  return (
    <div className="p-8 text-center">
      <div className="mx-auto grid size-11 place-items-center rounded-2xl bg-violet-50 text-violet-600"><Icon className="size-5" /></div>
      <h3 className="mt-3 font-semibold">{title}</h3>
      <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  );
}
