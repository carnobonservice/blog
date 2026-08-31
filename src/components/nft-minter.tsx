"use client";

import { useCurrentAccount, useCurrentClient, useDAppKit } from "@mysten/dapp-kit-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Transaction } from "@mysten/sui/transactions";
import { Check, ImagePlus, Loader2, Sparkles, Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

type GalleryImage = {
    id: string;
    owner: string;
    url: string;
    publicId: string;
    createdAt: string;
    updatedAt: string;
};

type MintStatus = {
    tone: "success" | "error" | "info";
    message: string;
};

export function NftMinter() {
    const account = useCurrentAccount();
    const client = useCurrentClient();
    const dAppKit = useDAppKit();

    const queryClient = useQueryClient();

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [selectedImage, setSelectedImage] = useState("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState("");
    const [uploadingImage, setUploadingImage] = useState(false);
    const [minting, setMinting] = useState(false);
    const [status, setStatus] = useState<MintStatus | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const {
        data: gallery = [],
        isPending: loadingGallery,
    } = useQuery({
        queryKey: ["nft-gallery", account?.address],
        queryFn: async () => {
            const response = await fetch(
                `/api/profile/upload?walletAddress=${encodeURIComponent(account!.address)}`,
            );
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Unable to load your images.");
            return (data.images ?? []) as GalleryImage[];
        },
        enabled: Boolean(account?.address),
    });

    function handleFileChange(file: File | null) {
        setSelectedFile(file);
        if (file) {
            setPhotoPreview(URL.createObjectURL(file));
            setSelectedImage("");
        } else {
            setPhotoPreview("");
        }
    }

    async function uploadImage() {
        if (!selectedFile) {
            setStatus({ tone: "error", message: "Pick an image file first." });
            return;
        }
        if (!account?.address) {
            setStatus({ tone: "error", message: "Connect your wallet before uploading an image." });
            return;
        }

        setUploadingImage(true);
        setStatus({ tone: "info", message: "Uploading your image to Cloudinary..." });
        try {
            const formData = new FormData();
            formData.append("file", selectedFile);
            formData.append("walletAddress", account.address);

            const response = await fetch("/api/profile/upload", {
                method: "POST",
                body: formData,
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Image upload failed.");

            setSelectedImage(data.image?.url ?? data.secureUrl);
            setSelectedFile(null);
            setStatus({ tone: "success", message: "Image uploaded. Ready to mint your NFT." });
            await queryClient.invalidateQueries({ queryKey: ["nft-gallery"] });
        } catch (error) {
            console.error(error);
            setStatus({
                tone: "error",
                message: error instanceof Error ? error.message : "Image upload failed.",
            });
        } finally {
            setUploadingImage(false);
        }
    }

    async function mintNft() {
        if (!account?.address) {
            setStatus({ tone: "error", message: "Connect your wallet before minting an NFT." });
            return;
        }
        if (!name.trim()) {
            setStatus({ tone: "error", message: "Give your NFT a name." });
            return;
        }
        if (!selectedImage) {
            setStatus({ tone: "error", message: "Choose an image for your NFT." });
            return;
        }

        const moveTarget = process.env.NEXT_PUBLIC_NFT_MOVE_TARGET;
        if (!moveTarget) {
            setStatus({
                tone: "error",
                message: "Set NEXT_PUBLIC_NFT_MOVE_TARGET to a Move target before minting.",
            });
            return;
        }

        setMinting(true);
        setStatus({ tone: "info", message: "Requesting wallet signature for the mint..." });
        try {
            const tx = new Transaction();
            tx.moveCall({
                target: moveTarget,
                arguments: [
                    tx.pure.string(name.trim()),
                    tx.pure.string(description.trim()),
                    tx.pure.string(selectedImage),
                ],
            });

            const result = await dAppKit.signAndExecuteTransaction({ transaction: tx });
            if (result.$kind === "FailedTransaction") {
                throw new Error(
                    result.FailedTransaction.status.error?.message ?? "The mint transaction failed.",
                );
            }

            const digest = result.Transaction.digest;
            await client.core.waitForTransaction({ digest });

            const saveResponse = await fetch("/api/nft", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    walletAddress: account.address,
                    name: name.trim(),
                    description: description.trim(),
                    image: selectedImage,
                    digest,
                }),
            });

            const saveData = await saveResponse.json().catch(() => ({}));
            if (!saveResponse.ok) {
                throw new Error(saveData.error || "Unable to save the NFT record.");
            }

            await fetch("/api/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    walletAddress: account.address,
                    nftMintedDigest: digest,
                }),
            });

            await queryClient.invalidateQueries({ queryKey: ["profile-nfts", account.address] });

            setStatus({
                tone: "success",
                message: "NFT minted successfully! Your NFT is now on Sui and saved in the database.",
            });
        } catch (error) {
            console.error(error);
            setStatus({
                tone: "error",
                message: error instanceof Error ? error.message : "Minting failed.",
            });
        } finally {
            setMinting(false);
        }
    }

    function clearSelection() {
        setSelectedImage("");
        setSelectedFile(null);
        setPhotoPreview("");
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }

    const canMint = Boolean(account?.address && name.trim() && selectedImage && !minting);

    return (
        <section className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm">
            <div className="border-b border-black/5 bg-gradient-to-r from-violet-600/5 via-fuchsia-500/5 to-orange-400/5 px-5 py-4 sm:px-6">
                <div className="flex items-center gap-2.5">
                    <div className="grid size-9 place-items-center rounded-xl bg-violet-600 text-white">
                        <Sparkles className="size-4" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold">Mint your NFT</h2>
                        <p className="text-sm text-muted-foreground">
                            Choose a name, description and image for your NFT.
                        </p>
                    </div>
                </div>
            </div>

            <div className="space-y-5 p-5 sm:p-6">
                <div className="grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
                    <div>
                        <p className="text-sm font-semibold">NFT image</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            Upload a new image or pick one from your gallery.
                        </p>

                        {selectedImage || photoPreview ? (
                            <div className="relative mt-3 overflow-hidden rounded-2xl border border-black/5 bg-slate-100">
                                <img
                                    alt="NFT preview"
                                    className="aspect-square w-full object-cover"
                                    src={photoPreview || selectedImage}
                                />
                                <button
                                    aria-label="Remove selected image"
                                    className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-slate-950/60 text-white backdrop-blur-sm transition hover:bg-slate-950/80"
                                    onClick={clearSelection}
                                    type="button"
                                >
                                    <X className="size-3.5" />
                                </button>
                                <span className="absolute bottom-2 left-2 rounded-full bg-slate-950/60 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
                                    {photoPreview ? "New upload" : "From gallery"}
                                </span>
                            </div>
                        ) : (
                            <button
                                className="mt-3 grid aspect-square w-full place-items-center rounded-2xl border-2 border-dashed border-violet-200 bg-violet-50/50 text-violet-500 transition hover:border-violet-400 hover:bg-violet-50"
                                onClick={() => fileInputRef.current?.click()}
                                type="button"
                            >
                                <div className="text-center">
                                    <ImagePlus className="mx-auto size-7" />
                                    <p className="mt-2 text-sm font-semibold">Choose image</p>
                                    <p className="mt-0.5 px-6 text-xs text-muted-foreground">
                                        Upload a new image or pick from your gallery
                                    </p>
                                </div>
                            </button>
                        )}

                        <input
                            accept="image/*"
                            className="sr-only"
                            onChange={(event) => handleFileChange(event.target.files?.[0] ?? null)}
                            ref={fileInputRef}
                            type="file"
                        />

                        <div className="mt-3 space-y-2">
                            <button
                                className={cn(
                                    "flex w-full items-center justify-center gap-2 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-semibold transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50",
                                    uploadingImage && "pointer-events-none opacity-60",
                                )}
                                disabled={!selectedFile || uploadingImage}
                                onClick={() => void uploadImage()}
                                type="button"
                            >
                                {uploadingImage ? (
                                    <Loader2 className="size-4 animate-spin" />
                                ) : (
                                    <Upload className="size-4 text-violet-600" />
                                )}
                                {selectedFile ? `Upload ${selectedFile.name}` : "No file chosen"}
                            </button>
                        </div>

                        {!selectedFile && gallery.length > 0 && (
                            <div className="mt-3">
                                <p className="text-xs font-medium text-muted-foreground">
                                    Your gallery ({gallery.length})
                                </p>
                                <div className="mt-2 grid grid-cols-4 gap-2">
                                    {gallery.map((image) => (
                                        <button
                                            key={image.id}
                                            aria-label="Use this image for the NFT"
                                            className={cn(
                                                "group relative aspect-square overflow-hidden rounded-lg ring-2 ring-transparent transition hover:ring-violet-400",
                                                selectedImage === image.url && "ring-violet-600",
                                            )}
                                            onClick={() => {
                                                setSelectedImage(image.url);
                                                setSelectedFile(null);
                                                setPhotoPreview("");
                                                if (fileInputRef.current) {
                                                    fileInputRef.current.value = "";
                                                }
                                            }}
                                            type="button"
                                        >
                                            <img
                                                src={image.url}
                                                alt="Gallery option"
                                                className="h-full w-full object-cover"
                                            />
                                            {selectedImage === image.url && (
                                                <span className="absolute inset-0 grid place-items-center bg-violet-600/40 text-white">
                                                    <Check className="size-5" />
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {loadingGallery && (
                            <p className="mt-3 text-xs text-muted-foreground">
                                Loading your gallery…
                            </p>
                        )}
                    </div>

                    <div className="min-w-0 space-y-4">
                        <div>
                            <label className="text-sm font-semibold" htmlFor="nft-name">
                                Name
                            </label>
                            <input
                                id="nft-name"
                                className="mt-1.5 w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                                onChange={(event) => setName(event.target.value)}
                                placeholder="e.g. My first Sui NFT"
                                type="text"
                                value={name}
                            />
                        </div>

                        <div>
                            <label className="text-sm font-semibold" htmlFor="nft-description">
                                Description
                            </label>
                            <textarea
                                id="nft-description"
                                className="mt-1.5 min-h-32 w-full resize-none rounded-xl border bg-white px-3 py-2.5 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                                maxLength={500}
                                onChange={(event) => setDescription(event.target.value)}
                                placeholder="Tell the story behind your NFT…"
                                value={description}
                            />
                            <div className="mt-1 flex justify-end">
                                <span className="text-xs tabular-nums text-muted-foreground">
                                    {description.length}/500
                                </span>
                            </div>
                        </div>

                        {!account?.address ? (
                            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                                Connect your Sui wallet to mint an NFT.
                            </div>
                        ) : null}

                        {status ? (
                            <div
                                className={cn(
                                    "rounded-xl border px-4 py-3 text-sm font-medium",
                                    status.tone === "success"
                                        ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                                        : status.tone === "error"
                                            ? "border-rose-100 bg-rose-50 text-rose-700"
                                            : "border-violet-100 bg-violet-50 text-violet-700",
                                )}
                                role="status"
                            >
                                {status.message}
                            </div>
                        ) : null}

                        <button
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={!canMint}
                            onClick={() => void mintNft()}
                            type="button"
                        >
                            {minting ? (
                                <>
                                    <Loader2 className="size-4 animate-spin" />
                                    Minting…
                                </>
                            ) : (
                                <>
                                    <Sparkles className="size-4" />
                                    Mint NFT
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}
