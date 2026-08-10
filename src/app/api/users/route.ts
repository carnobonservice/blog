import { findOrCreateUser } from "@/app/lib/mongodbUser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUI_ADDRESS = /^0x[0-9a-fA-F]{1,64}$/;

type UserPayload = {
  walletAddress?: unknown;
  displayName?: unknown;
  bio?: unknown;
  location?: unknown;
  website?: unknown;
  profileImage?: unknown;
  coverImage?: unknown;
  nftMintedDigest?: unknown;
};

export async function POST(request: Request) {
  let body: UserPayload;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  if (typeof body.walletAddress !== "string" || !SUI_ADDRESS.test(body.walletAddress)) {
    return Response.json({ error: "A valid Sui wallet address is required." }, { status: 400 });
  }

  const updates: Record<string, string> = {};
  const setIfString = (key: keyof UserPayload, value: unknown) => {
    if (typeof value === "string") {
      updates[key] = value;
    }
  };

  setIfString("displayName", body.displayName);
  setIfString("bio", body.bio);
  setIfString("location", body.location);
  setIfString("website", body.website);
  setIfString("profileImage", body.profileImage);
  setIfString("coverImage", body.coverImage);
  setIfString("nftMintedDigest", body.nftMintedDigest);

  try {
    const user = await findOrCreateUser(body.walletAddress.toLowerCase(), updates);
    return Response.json({ user });
  } catch (error) {
    console.error("Failed to create or find user:", error);
    return Response.json({ error: "Unable to save the user right now." }, { status: 500 });
  }
}
