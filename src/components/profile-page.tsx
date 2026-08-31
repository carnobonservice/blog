"use client";

import { useCurrentAccount } from "@mysten/dapp-kit-react";
import { useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, CalendarDays, Camera, Check, Edit3, Heart, Link2, MapPin, MessageCircle, MoreHorizontal, Share2, Sparkles, Upload, Sparkle } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { NftMinter } from "@/components/nft-minter";
import { ProfileAssets } from "@/components/profile-assets";

type DatabaseUser = {
  displayName: string;
  bio: string;
  location: string;
  website: string;
  profileImage?: string;
  coverImage?: string;
  nftMintedDigest?: string;
};

type ProfileState = {
  name: string;
  bio: string;
  location: string;
  website: string;
  profileImage: string;
  coverImage: string;
  nftMintedDigest: string;
};

const defaultProfile: ProfileState = {
  name: "Your name",
  bio: "Making room for good ideas, curious people, and the little things worth sharing.",
  location: "Ho Chi Minh City",
  website: "yourspace.com",
  profileImage: "",
  coverImage: "",
  nftMintedDigest: "",
};

const activity = [
  { id: 1, text: "Shared a new post", time: "2h", likes: 24, replies: 4, image: true },
  { id: 2, text: "Today I’m choosing progress over perfection. A small step towards the thing you care about is still a win. What’s one thing you’re moving forward today?", time: "Yesterday", likes: 68, replies: 11, image: false },
];

function shortAddress(address?: string) {
  return address ? `${address.slice(0, 6)}…${address.slice(-4)}` : "@yourprofile";
}

export function ProfilePage() {
  const account = useCurrentAccount();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"posts" | "likes" | "about">("posts");
  const [editing, setEditing] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusTone, setStatusTone] = useState<"success" | "error" | "info">("info");
  const [profile, setProfile] = useState<ProfileState>(defaultProfile);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    const walletAddress = account?.address;
    if (!walletAddress) return;

    let cancelled = false;

    async function syncUser() {
      try {
        const response = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ walletAddress }),
        });
        if (!response.ok) throw new Error("Unable to sync user");

        const { user }: { user: DatabaseUser } = await response.json();
        if (!cancelled) {
          setProfile({
            name: user.displayName || defaultProfile.name,
            bio: user.bio || defaultProfile.bio,
            location: user.location || defaultProfile.location,
            website: user.website || defaultProfile.website,
            profileImage: user.profileImage || "",
            coverImage: user.coverImage || "",
            nftMintedDigest: user.nftMintedDigest || "",
          });
        }
      } catch (error) {
        console.error("Unable to load user profile:", error);
      }
    }

    void syncUser();
    return () => {
      cancelled = true;
    };
  }, [account?.address]);

  async function saveProfile() {
    if (!account?.address) {
      setStatusMessage("Connect your wallet first so we can save the profile.");
      setStatusTone("error");
      return;
    }

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: account.address,
          displayName: profile.name,
          bio: profile.bio,
          location: profile.location,
          website: profile.website,
          profileImage: profile.profileImage,
          coverImage: profile.coverImage,
        }),
      });

      if (!response.ok) throw new Error("Unable to save the profile");

      setEditing(false);
      setStatusMessage("Profile changes saved and synced.");
      setStatusTone("success");
    } catch (error) {
      console.error(error);
      setStatusMessage(error instanceof Error ? error.message : "Unable to save the profile.");
      setStatusTone("error");
    }
  }

  async function uploadProfileImage() {
    if (!selectedFile) {
      setStatusMessage("Pick an image file first.");
      setStatusTone("error");
      return;
    }

    if (!account?.address) {
      setStatusMessage("Connect your wallet first so we can save the uploaded image.");
      setStatusTone("error");
      return;
    }

    setUploadingImage(true);
    setStatusMessage("Uploading your image to Cloudinary...");
    setStatusTone("info");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("walletAddress", account.address);

      const response = await fetch("/api/profile/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Image upload failed");

      const uploadedImage = data.image as { url: string; id: string; owner: string };
      await queryClient.invalidateQueries({ queryKey: ["nft-gallery", account.address] });
      setStatusMessage(
        `Image saved to your gallery (${uploadedImage.url}). You can now set it as your avatar or cover.`,
      );
      setStatusTone("success");
      setSelectedFile(null);
    } catch (error) {
      console.error(error);
      setStatusMessage(error instanceof Error ? error.message : "Image upload failed.");
      setStatusTone("error");
    } finally {
      setUploadingImage(false);
    }
  }

  async function useGalleryImage(imageUrl: string, placement: "profile" | "cover") {
    if (!account?.address) return;

    const updates = placement === "profile" ? { profileImage: imageUrl } : { coverImage: imageUrl };
    setProfile((current) => ({ ...current, ...updates }));

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: account.address, ...updates }),
      });
      if (!response.ok) throw new Error("Unable to update your profile image.");
      setStatusMessage(placement === "profile" ? "Avatar updated." : "Cover image updated.");
      setStatusTone("success");
    } catch (error) {
      console.error(error);
      setStatusMessage(error instanceof Error ? error.message : "Unable to update your profile image.");
      setStatusTone("error");
    }
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-[#f8f8fb] pb-12">
      <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6">
        <Link href="/" className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-violet-700">
          ← Back to your community
        </Link>

        <section className="overflow-hidden rounded-3xl border border-black/5 bg-white shadow-sm">
          <div className="relative h-44 bg-[radial-gradient(circle_at_18%_0%,rgba(255,255,255,.36),transparent_27%),radial-gradient(circle_at_86%_90%,rgba(255,194,89,.65),transparent_25%),linear-gradient(118deg,#352b83,#7558d5_47%,#e2888c)] sm:h-56">
            {profile.coverImage ? (
              <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${profile.coverImage})` }} />
            ) : null}
            <button aria-label="Change cover image" className="absolute right-4 top-4 inline-flex items-center gap-2 rounded-lg bg-black/20 px-3 py-2 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-black/30">
              <Camera className="size-3.5" /> Edit cover
            </button>
          </div>

          <div className="relative px-5 pb-6 sm:px-8">
            <div className="-mt-14 flex flex-col gap-4 sm:-mt-16 sm:flex-row sm:items-end sm:justify-between">
              <div className="relative grid size-28 place-items-center overflow-hidden rounded-[1.75rem] border-[5px] border-white bg-slate-900 text-2xl font-bold text-white shadow-sm sm:size-32">
                {profile.profileImage ? (
                  <img alt={profile.name} className="h-full w-full object-cover" src={profile.profileImage} />
                ) : (
                  profile.name.slice(0, 2).toUpperCase()
                )}
                <button aria-label="Change profile photo" className="absolute -bottom-1 -right-1 grid size-8 place-items-center rounded-full border-2 border-white bg-violet-600 text-white">
                  <Camera className="size-3.5" />
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                <button onClick={() => setEditing(true)} className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white px-3.5 py-2 text-sm font-semibold shadow-sm transition hover:bg-muted">
                  <Edit3 className="size-4" /> Edit profile
                </button>
                <button aria-label="Share profile" className="grid size-10 place-items-center rounded-xl border border-black/10 bg-white shadow-sm hover:bg-muted">
                  <Share2 className="size-4" />
                </button>
              </div>
            </div>

            <div className="mt-4 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{profile.name}</h1>
                <BadgeCheck className="size-5 text-violet-600" />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{shortAddress(account?.address)}</p>
              <p className="mt-4 leading-6 text-foreground/85">{profile.bio}</p>
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5"><MapPin className="size-4" /> {profile.location}</span>
                <span className="inline-flex items-center gap-1.5 text-violet-700"><Link2 className="size-4" /> {profile.website}</span>
                <span className="inline-flex items-center gap-1.5"><CalendarDays className="size-4" /> Joined August 2026</span>
              </div>
              <div className="mt-5 flex flex-wrap gap-6 text-sm">
                <span><b className="font-bold text-foreground">42</b> <span className="text-muted-foreground">Following</span></span>
                <span><b className="font-bold text-foreground">128</b> <span className="text-muted-foreground">Followers</span></span>
              </div>
            </div>
          </div>
        </section>

        {statusMessage ? (
          <div className={cn("mt-4 rounded-xl border px-4 py-3 text-sm font-medium", statusTone === "success" ? "border-emerald-100 bg-emerald-50 text-emerald-700" : statusTone === "error" ? "border-rose-100 bg-rose-50 text-rose-700" : "border-violet-100 bg-violet-50 text-violet-700")}>
            {statusTone === "success" ? <Check className="mr-2 inline size-4" /> : statusTone === "error" ? <Sparkle className="mr-2 inline size-4" /> : <Sparkles className="mr-2 inline size-4" />}
            {statusMessage}
          </div>
        ) : null}

        <section className="mt-6 overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm">
          <div className="flex gap-6 border-b px-5 sm:px-6">
            {(["posts", "likes", "about"] as const).map((item) => (
              <button key={item} onClick={() => setTab(item)} className={cn("border-b-2 py-4 text-sm font-semibold capitalize transition", tab === item ? "border-violet-600 text-violet-700" : "border-transparent text-muted-foreground hover:text-foreground")}>{item === "posts" ? "Posts" : item === "likes" ? "Likes" : "About"}</button>
            ))}
          </div>

          {tab === "posts" && (
            <div>
              {activity.map((post) => (
                <article key={post.id} className="p-5 sm:p-6">
                  <div className="flex gap-3">
                    <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-slate-900 text-xs font-bold text-white">YO</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold">{profile.name} <span className="font-normal text-muted-foreground">{shortAddress(account?.address)} · {post.time}</span></p>
                        </div>
                        <button aria-label="More options" className="text-muted-foreground"><MoreHorizontal className="size-5" /></button>
                      </div>
                      <p className="mt-3 leading-6 text-foreground/90">{post.text}</p>
                      {post.image && (
                        <div className="mt-4 grid h-60 place-items-center overflow-hidden rounded-2xl bg-[radial-gradient(circle_at_20%_80%,#e1bbff,transparent_27%),radial-gradient(circle_at_75%_15%,#ffd26d,transparent_22%),linear-gradient(135deg,#3c2483,#9b5bb8_55%,#f19a6d)]">
                          <div className="grid size-24 place-items-center rounded-[2rem] border border-white/35 bg-white/15 text-white backdrop-blur-sm">
                            <Sparkles className="size-9" />
                          </div>
                        </div>
                      )}
                      <div className="mt-4 flex gap-5 border-t pt-3 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5"><Heart className="size-4" /> {post.likes}</span>
                        <span className="inline-flex items-center gap-1.5"><MessageCircle className="size-4" /> {post.replies}</span>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
          {tab === "likes" && (
            <div className="p-10 text-center">
              <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-violet-50 text-violet-600"><Heart className="size-5" /></div>
              <h2 className="mt-4 font-bold">Posts you appreciate</h2>
              <p className="mt-1 text-sm text-muted-foreground">Liked posts will show up here.</p>
            </div>
          )}
          {tab === "about" && (
            <div className="space-y-4 p-5 text-sm sm:p-6">
              <div>
                <p className="font-semibold">About me</p>
                <p className="mt-1 leading-6 text-muted-foreground">{profile.bio}</p>
              </div>
              <div className="grid gap-3 border-t pt-4 sm:grid-cols-2">
                <p><span className="text-muted-foreground">Location</span><br /><b>{profile.location}</b></p>
                <p><span className="text-muted-foreground">Website</span><br /><b className="text-violet-700">{profile.website}</b></p>
              </div>
            </div>
          )}
        </section>

        <ProfileAssets onUseImage={useGalleryImage} />

        <section className="mt-6 rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Upload image to Cloudinary</h2>
              <p className="mt-1 text-sm text-muted-foreground">Upload a profile image to Cloudinary and save it to your profile.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-black/10 bg-white px-3.5 py-2 text-sm font-semibold shadow-sm transition hover:bg-muted">
                <Upload className="size-4" />
                {selectedFile ? selectedFile.name : "Choose image"}
                <input accept="image/*" className="sr-only" onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)} type="file" />
              </label>
              <button disabled={uploadingImage || !selectedFile} onClick={uploadProfileImage} className="rounded-xl bg-violet-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50">
                {uploadingImage ? "Uploading..." : "Upload image"}
              </button>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-dashed border-violet-200 bg-violet-50/70 p-4 text-sm text-violet-800">
            <p className="font-semibold">Setup tip</p>
            <p className="mt-1 leading-6">
              Configure <span className="font-mono">CLOUDINARY_CLOUD_NAME</span>, <span className="font-mono">CLOUDINARY_API_KEY</span>, and <span className="font-mono">CLOUDINARY_API_SECRET</span> in your environment.
            </p>
          </div>
        </section>

        <div className="mt-6">
          <NftMinter />
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/35 p-4 backdrop-blur-sm">
          <section aria-modal="true" role="dialog" className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Edit profile</h2>
              <button onClick={() => setEditing(false)} className="text-sm text-muted-foreground hover:text-foreground">Cancel</button>
            </div>
            <div className="mt-5 space-y-4">
              <label className="block text-sm font-semibold">Name<input value={profile.name} onChange={(event) => setProfile({ ...profile, name: event.target.value })} className="mt-1.5 w-full rounded-xl border bg-white px-3 py-2.5 font-normal outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100" /></label>
              <label className="block text-sm font-semibold">Bio<textarea value={profile.bio} onChange={(event) => setProfile({ ...profile, bio: event.target.value })} className="mt-1.5 min-h-24 w-full resize-none rounded-xl border bg-white px-3 py-2.5 font-normal outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100" /></label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-semibold">Location<input value={profile.location} onChange={(event) => setProfile({ ...profile, location: event.target.value })} className="mt-1.5 w-full rounded-xl border bg-white px-3 py-2.5 font-normal outline-none focus:border-violet-500" /></label>
                <label className="block text-sm font-semibold">Website<input value={profile.website} onChange={(event) => setProfile({ ...profile, website: event.target.value })} className="mt-1.5 w-full rounded-xl border bg-white px-3 py-2.5 font-normal outline-none focus:border-violet-500" /></label>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setEditing(false)} className="rounded-xl px-4 py-2 text-sm font-semibold hover:bg-muted">Cancel</button>
              <button onClick={saveProfile} className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700">Save profile</button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
